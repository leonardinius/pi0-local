# Pi Telegram Ingress Hardening Failclosed Caddy Firewall Dns Cleanup

## Why

Сейчас есть критичные операционные пробелы: `sync-ingress` не полностью fail-closed, loopback/bind и bypass-origin проверки не формализованы, firewall-hardening не зафиксирован как проверяемый процесс, и остаются висячие DNS routes, дающие `404` (как `test2-apps.it101.org`). Закрыть это нужно до масштабирования publish beyond canary.

## What

Собрать единый hardening-контур вокруг publish ingress:
- строгая fail-closed валидация проекта перед генерацией маршрутов;
- единый hostname contract только `https://<project>-<base>/`;
- проверяемая Caddy+origin модель (upstream только `127.0.0.1:<APP_PORT>`);
- формализованные firewall/bypass проверки;
- диагностика и безопасная очистка dangling DNS routes (dry-run first).

Definition of done: есть обновлённые скрипты/документация/чеклисты, по которым любой агент может воспроизвести проверку и подтвердить, что невалидные проекты не публикуются, origin bypass закрыт, dangling routes выявляются и удаляются безопасно.

## Acceptance criteria

1. `scripts/sync-ingress.ts` публикует только проекты, прошедшие validation matrix: `.expose.yml enabled: true`, валидный `APP_PORT`, валидный `compose.yaml`, match порта с контрактом compose.
2. Для невалидных проектов `sync-ingress` выдаёт reason code (`EXPOSE_DISABLED`, `APP_PORT_MISSING`, `APP_PORT_INVALID`, `COMPOSE_INVALID`, `PORT_MISMATCH`, `INVALID_PROJECT_SLUG`) и не генерирует route.
3. Hostname формируется только как `<project>-<base>`; `APP_PUBLIC_URL` не используется как override публичного host.
4. Generated Caddy routes используют только `reverse_proxy 127.0.0.1:<APP_PORT>`.
5. Есть проверка/чеклист, подтверждающий, что Caddy/origin конфигурация не даёт direct bypass (включая IPv4/IPv6 и Docker-published ports).
6. Есть формализованный firewall hardening checklist с проверяемыми исходами: direct external access к app-портам blocked, localhost probe success.
7. Есть drift-диагностика managed DNS routes `<project>-<base>` с `dry-run` и `apply` режимами; в `apply` удаляются только dangling managed entries.
8. Для системных шагов обязательными считаются operational checks из runbook; обязательный прогон `npm test`/`npm run validate` не требуется.

## Steps

1. **Зафиксировать ingress security contract и scope**  
   Обновить `plans/doing/projpub-v1-cf-caddy-localbind.md` и/или новый runbook: hostname только `<project>-<base>`, managed DNS pattern только `<project>-<base>`, запрет custom host override через `APP_PUBLIC_URL`.  
   _Deliverables_: обновлённый план/док-спека с явными non-goals.

2. **Сконсолидировать fail-closed validation в одном источнике истины**  
   Вынести/переиспользовать validation logic между `scripts/validate-expose.ts` и `scripts/sync-ingress.ts`, чтобы не было drift; добавить `INVALID_PROJECT_SLUG`; описать точный port-contract для `compose.yaml`.  
   _Deliverables_: обновлённые `scripts/validate-expose.ts`, `scripts/sync-ingress.ts` (или shared validator module).  
   
3. **Переподключить `sync-ingress` на validation matrix и reason summary** `(depends_on: 2)`  
   Генерация routes только из валидных проектов; reason-code breakdown в stdout/stderr; безопасная атомарная запись + validate + reload + rollback остаются.  
   _Deliverables_: обновлённый `scripts/sync-ingress.ts`, предсказуемый формат summary.

4. **Убрать влияние `APP_PUBLIC_URL` на публичный host** `(depends_on: 3)`  
   Принудительно формировать host из `<project>-<base>`; обновить связанные места (`agent/bin/project`, `scripts/external/project`, `pi-telegram/lib/projects.ts`) так, чтобы UI/логика не вводили в заблуждение.  
   _Deliverables_: согласованный host derivation в скриптах и Telegram UI.

5. **Сформализовать Caddy/origin модель и loopback-проверки** `(depends_on: 1)`  
   Добавить runbook-блок с явными командами проверки bind/listeners (`ss`, `caddy validate`, `systemctl status`, probe matrix), включая IPv6. Отдельно зафиксировать, что upstream только loopback.  
   _Deliverables_: `docs/runbook-project-publish-ingress.md` (или эквивалент) с pass/fail критериями.

6. **Сформализовать firewall hardening и bypass-origin checklist** `(depends_on: 5)`  
   Описать базовый policy (ufw/nftables), Docker-chain caveats, rollback и preflight inventory. Добавить проверочный сценарий: external direct-port blocked, local upstream reachable.  
   _Deliverables_: runbook section + проверочный сценарий/скрипт (read-only checks).

7. **Добавить DNS/route drift diagnosis (dry-run first)** `(depends_on: 4)`  
   Реализовать утилиту сравнения managed DNS routes vs current valid project routes; помечать dangling записи с причинами (`DANGLING_DNS_ROUTE_404` и пр.).  
   _Deliverables_: новый `scripts/*dns*`/`scripts/*ingress-drift*` инструмент и формат отчёта.

8. **Добавить безопасный apply-cleanup для dangling managed routes** `(depends_on: 7)`  
   `apply` удаляет только managed pattern `<project>-<base>`, отсутствующий в valid route set; по умолчанию `dry-run`; лог удаления обязателен.  
   _Deliverables_: расширение drift tool + runbook-инструкция по применению.

9. **Интеграция с lifecycle и эксплуатационная валидация сценариями** `(depends_on: 3, 4, 6, 8)`  
   Проверить end-to-end на кейсах: valid project publish, invalid project blocked, deleted project route removed, dangling DNS detected/cleaned; синхронизировать тексты в `README.md`/`docs/architecture.md` при user-visible изменениях.  
   _Deliverables_: обновлённые docs + checklist результатов.

## Progress

- [ ] Step 1: Зафиксировать ingress security contract и scope
- [ ] Step 2: Сконсолидировать fail-closed validation в одном источнике истины
- [ ] Step 3: Переподключить `sync-ingress` на validation matrix и reason summary
- [ ] Step 4: Убрать влияние `APP_PUBLIC_URL` на публичный host
- [ ] Step 5: Сформализовать Caddy/origin модель и loopback-проверки
- [ ] Step 6: Сформализовать firewall hardening и bypass-origin checklist
- [ ] Step 7: Добавить DNS/route drift diagnosis (dry-run first)
- [ ] Step 8: Добавить безопасный apply-cleanup для dangling managed routes
- [ ] Step 9: Интеграция с lifecycle и эксплуатационная валидация сценариями

## Dependencies

- `plans/doing/projpub-v1-cf-caddy-localbind.md` (активный родительский план; этот план уточняет и закрывает его critical gaps).

## Constraints / non-goals

- Поддерживается только host pattern `https://<project>-<base>/`.
- Не внедряется custom-domain routing и не поддерживается `APP_PUBLIC_URL` как publish override.
- Не делаются изменения вне ingress/publish security scope.
- Для системных шагов не требуется обязательный `npm test`/`npm run validate`; опора на operational checks.
- Не допускается автоматическое удаление DNS записей вне managed pattern `<project>-<base>`.
- Любые firewall-изменения исполняются только с rollback-планом и сохранением админ-доступа (SSH/console).

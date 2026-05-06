import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Input, Key, matchesKey, truncateToWidth, type Focusable } from "@mariozechner/pi-tui";

type FreeModel = {
	rank: number;
	id: string;
	name: string;
	score: number;
	contextLength?: number;
	supportsTools?: boolean;
	supportsReasoning?: boolean;
	latencyMs?: number | null;
};

type FreeModelData = {
	updatedAt: string;
	count: number;
	models: FreeModel[];
	notes?: string[];
	fallback?: {
		id: string;
		reason?: string;
	};
};

type DebugLine = {
	text: string;
	kind: "info" | "warning" | "error";
};

const CACHE_PATH = path.join(os.homedir(), ".pi/agent/prusax0/cache/free-models.json");
const CACHE_DIR = path.dirname(CACHE_PATH);
const SOURCE_URL = "https://shir-man.com/api/free-llm/top-models";
const TTL_MS = 2 * 60 * 60 * 1000;
const MAX_DEBUG_LINES = 80;
const MAX_RESPONSE_LINES = 10;
const MAX_LIST_ITEMS = 8;

function formatContextLength(value?: number): string {
	if (!value) return "?";
	if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
	if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
	return `${value}`;
}

function compactDate(value: string): string {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toISOString().replace("T", " ").slice(0, 16);
}

function summarizeModel(model: FreeModel): string {
	const badges = [model.supportsTools ? "tools" : null, model.supportsReasoning ? "reasoning" : null].filter(Boolean).join(", ");
	return `${model.rank}. ${model.name} · ${model.score} · ctx ${formatContextLength(model.contextLength)}${badges ? ` · ${badges}` : ""}`;
}

function buildSummaryLines(data: FreeModelData, fresh: boolean): string[] {
	const sorted = [...data.models].sort((a, b) => a.rank - b.rank);
	const top = [...sorted].sort((a, b) => b.score - a.score).slice(0, 5);
	const best = top[0];
	const lines = [
		`🆓 Free models · ${data.count} · updated ${compactDate(data.updatedAt)}${fresh ? "" : " · cached"}`,
	];
	if (best) lines.push(`Best: ${best.name} (${best.score}, ctx ${formatContextLength(best.contextLength)})`);
	lines.push("Top 5:");
	for (const model of top) lines.push(`• ${model.name} — ${model.score} · ${formatContextLength(model.contextLength)}`);
	if (data.notes?.length) {
		lines.push("Notes:");
		for (const note of data.notes.slice(0, 2)) lines.push(`• ${note}`);
	}
	return lines;
}

async function ensureCacheDir(): Promise<void> {
	await mkdir(CACHE_DIR, { recursive: true });
}

async function readCache(): Promise<FreeModelData> {
	const raw = await readFile(CACHE_PATH, "utf8");
	const data = JSON.parse(raw) as FreeModelData;
	if (!data || typeof data !== "object" || !Array.isArray(data.models) || typeof data.updatedAt !== "string") {
		throw new Error("Invalid cache file");
	}
	return data;
}

async function fetchAndCache(): Promise<FreeModelData> {
	const response = await fetch(SOURCE_URL);
	if (!response.ok) {
		throw new Error(`OpenRouter list fetch failed: ${response.status} ${response.statusText}`);
	}
	const data = (await response.json()) as FreeModelData;
	if (!data || typeof data !== "object" || !Array.isArray(data.models) || typeof data.updatedAt !== "string") {
		throw new Error("Invalid free-model payload");
	}
	await ensureCacheDir();
	await writeFile(CACHE_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
	return data;
}

async function loadModels(): Promise<{ data: FreeModelData; fresh: boolean; source: "cache" | "network" }> {
	let cached: FreeModelData | null = null;
	let stale = false;
	try {
		const info = await stat(CACHE_PATH);
		stale = Date.now() - info.mtimeMs > TTL_MS;
		cached = await readCache();
		if (!stale) {
			return { data: cached, fresh: true, source: "cache" };
		}
	} catch {
		cached = null;
	}

	try {
		const data = await fetchAndCache();
		return { data, fresh: true, source: "network" };
	} catch (error) {
		if (cached) {
			return { data: cached, fresh: false, source: "cache" };
		}
		throw error;
	}
}

function maskSecret(value: string): string {
	if (!value) return "";
	if (value.length <= 8) return "***";
	return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function formatHeaders(headers: Record<string, string>): string[] {
	const ordered = Object.entries(headers).sort(([a], [b]) => a.localeCompare(b));
	return ordered.map(([key, value]) => {
		if (/authorization/i.test(key)) return `${key}: Bearer ${maskSecret(value.replace(/^Bearer\s+/i, ""))}`;
		if (/api[-_]key/i.test(key)) return `${key}: ${maskSecret(value)}`;
		return `${key}: ${value}`;
	});
}

async function openRouterChat(
	modelId: string,
	prompt: string,
	pushDebug: (line: string, kind?: DebugLine["kind"]) => void,
	signal: AbortSignal,
): Promise<{ text: string; raw: unknown }> {
	const apiKey = process.env.OPENROUTER_API_KEY;
	if (!apiKey) {
		throw new Error("OPENROUTER_API_KEY is not set");
	}

	const baseUrl = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
	const referer = process.env.OPENROUTER_HTTP_REFERER ?? "https://pi.dev";
	const title = process.env.OPENROUTER_APP_TITLE ?? "Pi Free Model Test";
	const headers: Record<string, string> = {
		Authorization: `Bearer ${apiKey}`,
		"Content-Type": "application/json",
		"HTTP-Referer": referer,
		"X-Title": title,
	};
	const body = {
		model: modelId,
		messages: [{ role: "user", content: prompt }],
		stream: false,
		temperature: 0.2,
	};

	pushDebug(`[request] POST ${baseUrl}/chat/completions`);
	for (const line of formatHeaders(headers)) pushDebug(`[request] ${line}`);
	pushDebug(`[request] body: ${JSON.stringify({ ...body, messages: [{ role: "user", content: prompt.slice(0, 300) }] })}`);

	const response = await fetch(`${baseUrl}/chat/completions`, {
		method: "POST",
		headers,
		body: JSON.stringify(body),
		signal,
	});
	const text = await response.text();
	pushDebug(`[response] status ${response.status} ${response.statusText}`);
	pushDebug(`[response] body: ${text.slice(0, 1200)}`);

	if (!response.ok) {
		throw new Error(`OpenRouter error ${response.status}: ${text.slice(0, 200)}`);
	}

	const raw = JSON.parse(text) as { choices?: Array<{ message?: { content?: unknown } }>; usage?: unknown };
	const content = raw.choices?.[0]?.message?.content;
	const reply = Array.isArray(content) ? content.map((part) => (typeof part === "string" ? part : JSON.stringify(part))).join("\n") : String(content ?? "");
	return { text: reply.trim() };
}

class FreeModelTestApp implements Focusable {
	private readonly input = new Input();
	private readonly models: FreeModel[];
	private readonly onDone: (value: void) => void;
	private readonly tuiRef: { requestRender: () => void };
	private _focused = false;
	private mode: "model" | "input" = "model";
	private selectedIndex = 0;
	private response = "";
	private responseHeader = "No response yet.";
	private busy = false;
	private busyController: AbortController | null = null;
	private debugLines: DebugLine[] = [];
	private modelSourceLabel: string;
	private summaryLines: string[];
	private cacheLabel: string;

	constructor(
		tuiRef: { requestRender: () => void },
		models: FreeModel[],
		cacheInfo: { fresh: boolean; source: "cache" | "network"; updatedAt: string },
		done: (value: void) => void,
	) {
		this.tuiRef = tuiRef;
		this.models = [...models].sort((a, b) => a.rank - b.rank);
		this.onDone = done;
		this.summaryLines = buildSummaryLines({ updatedAt: cacheInfo.updatedAt, count: this.models.length, models: this.models }, cacheInfo.fresh);
		this.cacheLabel = cacheInfo.source === "network" ? "fresh network cache" : cacheInfo.fresh ? "fresh cache" : "stale cache";
		this.modelSourceLabel = `${this.models.length} models`;
		this.input.onSubmit = (value) => {
			void this.submit(value);
		};
		this.input.onEscape = () => {
			if (this.busy) {
				this.abortRequest();
				return;
			}
			if (this.mode === "input") {
				this.mode = "model";
				this.requestRender();
				return;
			}
			this.close();
		};
	}

	get focused(): boolean {
		return this._focused;
	}

	set focused(value: boolean) {
		this._focused = value;
		this.input.focused = value;
	}

	private requestRender(): void {
		this.tuiRef.requestRender();
	}

	private addDebug(text: string, kind: DebugLine["kind"] = "info"): void {
		this.debugLines.push({ text, kind });
		if (this.debugLines.length > MAX_DEBUG_LINES) {
			this.debugLines = this.debugLines.slice(-MAX_DEBUG_LINES);
		}
		this.requestRender();
	}

	private setResponse(text: string, kind: "info" | "warning" | "error" = "info"): void {
		this.response = text;
		this.responseHeader = kind === "error" ? "Error" : kind === "warning" ? "Warning" : "Response";
		this.requestRender();
	}

	private get selectedModel(): FreeModel {
		return this.models[this.selectedIndex] ?? this.models[0];
	}

	private abortRequest(): void {
		this.busyController?.abort();
		this.busyController = null;
		this.busy = false;
		this.addDebug("[request] aborted", "warning");
		this.setResponse("Request aborted.", "warning");
	}

	private close(): void {
		if (this.busy) {
			this.abortRequest();
		}
		this.onDone();
	}

	private async submit(value: string): Promise<void> {
		const prompt = value.trim();
		if (!prompt || this.busy) return;
		const model = this.selectedModel;
		if (!model) {
			this.setResponse("No model selected.", "error");
			return;
		}
		this.mode = "input";
		this.busy = true;
		this.busyController = new AbortController();
		this.addDebug(`[select] ${model.id} :: ${model.name}`);
		this.addDebug(`[prompt] ${prompt}`);
		this.setResponse("Sending request...", "info");
		this.input.setValue(prompt);
		this.requestRender();
		try {
			const result = await openRouterChat(
				model.id,
				prompt,
				(text, kind = "info") => this.addDebug(text, kind),
				this.busyController.signal,
			);
			this.setResponse(result.text || "(empty response)", result.text ? "info" : "warning");
			this.addDebug(`[result] ${result.text ? `${result.text.slice(0, 300)}` : "empty"}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.setResponse(message, "error");
			this.addDebug(`[error] ${message}`, "error");
		} finally {
			this.busy = false;
			this.busyController = null;
			this.requestRender();
		}
	}

	handleInput(data: string): void {
		if (this.busy) {
			if (matchesKey(data, Key.escape)) this.abortRequest();
			return;
		}

		if (this.mode === "input") {
			if (matchesKey(data, Key.tab)) {
				this.mode = "model";
				this.requestRender();
				return;
			}
			if (matchesKey(data, Key.escape)) {
				this.mode = "model";
				this.requestRender();
				return;
			}
			this.input.handleInput(data);
			this.requestRender();
			return;
		}

		if (matchesKey(data, Key.up)) {
			this.selectedIndex = Math.max(0, this.selectedIndex - 1);
			this.requestRender();
			return;
		}
		if (matchesKey(data, Key.down)) {
			this.selectedIndex = Math.min(this.models.length - 1, this.selectedIndex + 1);
			this.requestRender();
			return;
		}
		if (matchesKey(data, Key.enter) || matchesKey(data, Key.tab)) {
			this.mode = "input";
			this.requestRender();
			return;
		}
		if (matchesKey(data, Key.escape)) {
			this.close();
		}
	}

	render(width: number): string[] {
		const lines: string[] = [];
		const add = (line: string) => lines.push(truncateToWidth(line, width));
		const selected = this.selectedModel;
		const visible = this.models.slice(Math.max(0, this.selectedIndex - 3), Math.max(0, this.selectedIndex - 3) + MAX_LIST_ITEMS);

		add(`╭─ Free Model Test ─ ${this.cacheLabel} ─────────────────${"─".repeat(Math.max(0, width - 40))}`);
		add(`│ Selected: ${selected ? `${selected.name} · ${selected.id}` : "none"}`);
		add(`│ Summary: ${this.summaryLines[0] ?? ""}`);
		for (const line of this.summaryLines.slice(1, 5)) add(`│ ${line}`);
		add(`│ Models (${this.modelSourceLabel})`);
		for (let i = 0; i < visible.length; i++) {
			const model = visible[i];
			const index = this.models.indexOf(model);
			const marker = index === this.selectedIndex ? ">" : " ";
			const label = index === this.selectedIndex ? `* ${summarizeModel(model)}` : summarizeModel(model);
			add(`│ ${marker} ${label}`);
		}
		if (this.models.length > visible.length) {
			add(`│ … ${this.models.length - visible.length} more`);
		}
		add(`│`);
		add(`│ Input (${this.mode === "input" ? "active" : "model select"})`);
		for (const line of this.input.render(Math.max(10, width - 4)).slice(0, 3)) {
			add(`│ ${line}`);
		}
		add(`│ ${this.busy ? "Sending to OpenRouter... (Esc aborts)" : "Enter/Tab to edit, Up/Down to choose model, Esc to close"}`);
		add(`│`);
		add(`│ ${this.responseHeader}:`);
		const responseLines = this.response ? this.response.split(/\r?\n/g).slice(0, MAX_RESPONSE_LINES) : ["(no response yet)"];
		for (const line of responseLines) add(`│ ${line}`);
		add(`│`);
		add(`│ Debug:`);
		const tail = this.debugLines.slice(-8);
		for (const entry of tail) {
			const tag = entry.kind === "error" ? "✖" : entry.kind === "warning" ? "!" : "·";
			add(`│ ${tag} ${entry.text}`);
		}
		add(`╰────────────────────────────────────────────────${"─".repeat(Math.max(0, width - 48))}`);
		return lines;
	}

	invalidate(): void {
		this.requestRender();
	}
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("freemodel-test", {
		description: "OpenRouter free model test UI",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("freemodel-test requires interactive mode", "error");
				return;
			}

			try {
				const loaded = await loadModels();
				if (loaded.data.models.length === 0) {
					ctx.ui.notify("No free models available.", "warning");
					return;
				}

				await ctx.ui.custom<void>((tui, _theme, _keybindings, done) => {
					const app = new FreeModelTestApp(tui, loaded.data.models, { fresh: loaded.fresh, source: loaded.source, updatedAt: loaded.data.updatedAt }, done);
					app.focused = true;
					return app;
				});
			} catch (error) {
				ctx.ui.notify(error instanceof Error ? error.message : "Failed to open free model test", "error");
			}
		},
	});
}

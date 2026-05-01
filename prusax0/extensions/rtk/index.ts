import { createLocalBashOperations, type ExtensionAPI } from "@mariozechner/pi-coding-agent";

const RTK_GUIDANCE = `
RTK token-saving integration is active.
- Bash commands are transparently rewritten through \`rtk rewrite\` before execution when RTK supports them (for example: \`git status\`, \`ls\`, \`grep\`, \`find\`, \`cat\`, test/lint/build commands, docker/kubectl/aws/gh, etc.).
- Prefer Bash/RTK commands for high-output inspection and diagnostics so the model receives compact output: \`rtk read <file>\`, \`rtk grep <pattern> <path>\`, \`rtk find ...\` (simple queries only), \`rtk git diff\`, \`rtk test <cmd>\`, \`rtk err <cmd>\`, \`rtk json <file>\`, \`rtk smart <file>\`.
- For native \`find\` compound logic/predicates (for example \`-prune\`, \`-o\`, \`-not\`, \`-exec\`, \`-path\`), use raw \`find\` with \`RTK_DISABLE=1\` or \`# rtk:off\`.
- For complex/GNU-specific \`grep\` combinations (for example \`-R/-r\`, \`--include/--exclude*\`, \`-A/-B/-C\`, \`-m\`, \`-P\`, \`-z\`), use raw \`grep\` with \`RTK_DISABLE=1\` or \`# rtk:off\`.
- Pi built-in \`read\`, \`grep\`, \`find\`, and \`ls\` tools bypass shell rewriting; use them when exact Pi behavior is needed, but use Bash/RTK when compact output is preferable.
- Use Pi \`edit\`/\`write\` for file mutations; use RTK mainly for read-only or command-output-heavy workflows.
- If exact raw command output is required, prefix the command with \`RTK_DISABLE=1\` or include \`# rtk:off\` in the shell command.
- RTK token-savings analytics are available via \`rtk gain\` and Pi command \`/rtk gain\`.
`;

function needsRawFind(command: string): boolean {
	const hasFind = /(^|[;&|]\s*)find(\s|$)/.test(command);
	if (!hasFind) return false;
	if (command.includes("\\(") || command.includes("\\)")) return true;
	return /(^|\s)(-prune|-o|-not|-exec|-path)(\s|$)/.test(command);
}

function needsRawGrep(command: string): boolean {
	const hasGrep = /(^|[;&|]\s*)grep(\s|$)/.test(command);
	if (!hasGrep) return false;
	return /(^|\s)(-R|-r|-P|-z|-Z|-o|-q|--null|--line-buffered|--files-with-matches|--files-without-match|--include(?:=|\s)|--exclude(?:=|\s)|--exclude-dir(?:=|\s)|--binary-files(?:=|\s)|--devices(?:=|\s)|--directories(?:=|\s)|--max-count(?:=|\s)|-m\d*|-A\d*|-B\d*|-C\d*)(\s|$)/.test(command);
}

function shouldSkip(command: string): boolean {
	const trimmed = command.trim();
	return (
		trimmed.length === 0 ||
		trimmed.includes("RTK_DISABLE=1") ||
		trimmed.includes("# rtk:off") ||
		trimmed.includes("# rtk:raw") ||
		needsRawFind(trimmed) ||
		needsRawGrep(trimmed)
	);
}

function maybeUltraCompact(command: string): string {
	// Default to RTK's extra-compact formatting. Opt out with PI_RTK_ULTRA=0.
	if (process.env.PI_RTK_ULTRA === "0" || process.env.RTK_ULTRA === "0") return command;
	return command.replace(/(^|(?:[;&|]\s*))rtk\s+(?!--)/g, "$1rtk --ultra-compact ");
}

function shellQuote(value: string): string {
	return `'${value.replace(/'/g, `'"'"'`)}'`;
}

async function rewriteWithRtk(pi: ExtensionAPI, command: string, signal?: AbortSignal): Promise<string | undefined> {
	if (shouldSkip(command)) return undefined;
	try {
		// rtk 0.37.x exits with a non-zero status when it prints a rewrite, so run via sh and
		// force exit 0 to preserve stdout while keeping RTK failures non-fatal for Pi.
		const result = await pi.exec("/bin/sh", ["-lc", `rtk rewrite ${shellQuote(command)} 2>/dev/null || true`], {
			signal,
			timeout: 2500,
		});
		const rewritten = result.stdout.trim();
		if (!rewritten || rewritten === command.trim()) return undefined;
		return maybeUltraCompact(rewritten);
	} catch {
		// RTK must never break normal Pi command execution. If rewrite fails, run the original command.
		return undefined;
	}
}

export default function (pi: ExtensionAPI) {
	pi.on("before_agent_start", async (event) => {
		return { systemPrompt: `${event.systemPrompt}\n\n${RTK_GUIDANCE}` };
	});

	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "bash") return;
		const input = event.input as { command?: unknown };
		if (typeof input.command !== "string") return;

		const rewritten = await rewriteWithRtk(pi, input.command, ctx.signal);
		if (rewritten) input.command = rewritten;
	});

	pi.on("user_bash", () => {
		const local = createLocalBashOperations();
		return {
			operations: {
				async exec(command: string, cwd: string, options?: any) {
					const rewritten = await rewriteWithRtk(pi, command, options?.signal);
					return local.exec(rewritten ?? command, cwd, options);
				},
			},
		};
	});

	pi.registerCommand("rtk", {
		description: "Run an RTK meta command (default: gain). Example: /rtk gain",
		handler: async (args, ctx) => {
			const subcommand = args.trim() || "gain";
			const result = await pi.exec("/bin/sh", ["-lc", `rtk ${subcommand}`], { timeout: 30000 });
			const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim() || `(exit ${result.code})`;
			const text = output.length > 12000 ? `${output.slice(0, 12000)}\n...[truncated]` : output;
			pi.sendMessage({
				customType: "rtk",
				content: `RTK ${subcommand}\n\n\`\`\`text\n${text}\n\`\`\``,
				display: true,
				details: { command: `rtk ${subcommand}`, exitCode: result.code },
			});
			if (ctx.hasUI && result.code !== 0) ctx.ui.notify(`rtk ${subcommand} exited ${result.code}`, "warning");
		},
	});
}

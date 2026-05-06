import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";

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

type LoadResult = {
	data: FreeModelData;
	stale: boolean;
};

const CACHE_PATH = path.join(os.homedir(), ".pi/agent/prusax0/cache/free-models.json");
const CACHE_DIR = path.dirname(CACHE_PATH);
const SOURCE_URL = "https://shir-man.com/api/free-llm/top-models";
const TTL_MS = 60 * 60 * 1000;

function formatCount(value: number | undefined): string {
	return `${value ?? 0}`;
}

function formatContext(value?: number): string {
	if (!value) return "?";
	if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
	if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
	return `${value}`;
}

function compactDate(value: string): string {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toISOString().replace("T", " ").slice(0, 16);
}

function selectRecommendations(models: FreeModel[]) {
	const byScore = [...models].sort((a, b) => b.score - a.score || (b.contextLength ?? 0) - (a.contextLength ?? 0));
	const bestOverall = byScore[0];
	const bestTools = [...models].filter((m) => m.supportsTools).sort((a, b) => b.score - a.score)[0] ?? bestOverall;
	const bestReasoning = [...models].filter((m) => m.supportsReasoning).sort((a, b) => b.score - a.score)[0] ?? bestOverall;
	const bestContext = [...models].sort((a, b) => (b.contextLength ?? 0) - (a.contextLength ?? 0))[0] ?? bestOverall;

	return { bestOverall, bestTools, bestReasoning, bestContext, top: byScore.slice(0, 5) };
}

function buildSummary(data: FreeModelData, stale: boolean): string[] {
	const { bestOverall, bestTools, bestReasoning, bestContext, top } = selectRecommendations(data.models);
	const lines = [
		`🆓 Free models · ${formatCount(data.count)} · updated ${compactDate(data.updatedAt)}${stale ? " · cached" : ""}`,
	];

	if (bestOverall) {
		lines.push(`Best overall: ${bestOverall.name} (${bestOverall.score}, ctx ${formatContext(bestOverall.contextLength)})`);
	}
	if (bestTools && bestTools !== bestOverall) {
		lines.push(`Best tools: ${bestTools.name} (${bestTools.score})`);
	}
	if (bestReasoning && bestReasoning !== bestOverall && bestReasoning !== bestTools) {
		lines.push(`Best reasoning: ${bestReasoning.name} (${bestReasoning.score})`);
	}
	if (bestContext && bestContext !== bestOverall && bestContext !== bestTools && bestContext !== bestReasoning) {
		lines.push(`Best context: ${bestContext.name} (${formatContext(bestContext.contextLength)})`);
	}

	lines.push("Top 5:");
	for (const model of top) {
		lines.push(`• ${model.name} — ${model.score} · ${formatContext(model.contextLength)}`);
	}

	if (data.notes?.length) {
		lines.push("Notes:");
		for (const note of data.notes.slice(0, 2)) lines.push(`• ${note}`);
	}

	return lines;
}

async function ensureCacheDir(): Promise<void> {
	await mkdir(CACHE_DIR, { recursive: true });
}

async function readJsonFile(filePath: string): Promise<FreeModelData> {
	const raw = await readFile(filePath, "utf8");
	const data = JSON.parse(raw) as FreeModelData;
	if (!data || typeof data !== "object" || !Array.isArray(data.models) || typeof data.updatedAt !== "string") {
		throw new Error("Invalid free-model cache");
	}
	return data;
}

async function fetchRemote(): Promise<FreeModelData> {
	const response = await fetch(SOURCE_URL);
	if (!response.ok) {
		throw new Error(`Fetch failed: ${response.status}`);
	}
	const data = (await response.json()) as FreeModelData;
	if (!data || typeof data !== "object" || !Array.isArray(data.models) || typeof data.updatedAt !== "string") {
		throw new Error("Invalid free-model payload");
	}
	await ensureCacheDir();
	await writeFile(CACHE_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
	return data;
}

async function loadFreeModels(forceRefresh: boolean): Promise<LoadResult> {
	let cached: FreeModelData | null = null;
	let stale = false;

	try {
		const info = await stat(CACHE_PATH);
		stale = Date.now() - info.mtimeMs > TTL_MS;
		cached = await readJsonFile(CACHE_PATH);
		if (!forceRefresh && !stale) {
			return { data: cached, stale: false };
		}
	} catch {
		cached = null;
	}

	try {
		const data = await fetchRemote();
		return { data, stale: false };
	} catch (error) {
		if (cached) {
			return { data: cached, stale: true };
		}
		await rm(CACHE_PATH, { force: true }).catch(() => null);
		throw error;
	}
}

function renderWidget(data: FreeModelData, stale: boolean): string[] {
	return buildSummary(data, stale).slice(0, 10);
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("freemodel", {
		description: "Show free model recommendations",
		handler: async (args: string | undefined, ctx: ExtensionCommandContext) => {
			const forceRefresh = (args ?? "").trim().toLowerCase().includes("refresh");
			try {
				const result = await loadFreeModels(forceRefresh);
				if (result.data.models.length === 0) {
					ctx.ui.setWidget("free-models", ["No free models available."], { placement: "belowEditor" });
					ctx.ui.notify("No free models available.", "warning");
					return;
				}
				const summary = buildSummary(result.data, result.stale);
				ctx.ui.setWidget("free-models", renderWidget(result.data, result.stale), { placement: "belowEditor" });
				ctx.ui.notify(summary[0] ?? "Loaded free models", "info");
			} catch (error) {
				ctx.ui.setWidget("free-models", ["⚠️ Failed to load free models. Try again later."], { placement: "belowEditor" });
				ctx.ui.notify(error instanceof Error ? error.message : "Failed to load free models", "error");
			}
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		try {
			const data = await readJsonFile(CACHE_PATH);
			ctx.ui.setStatus("free-models", `🆓 free models cached · ${data.count}`);
		} catch {
			ctx.ui.setStatus("free-models", undefined);
		}
	});

	pi.on("session_end", async (_event, ctx) => {
		ctx.ui.setStatus("free-models", undefined);
	});
}

import type { ExtensionAPI, SlashCommandInfo } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("extensions", {
    description: "List all available slash commands (extensions, skills, prompts). BTW excluded.",
    handler: async (_args, _ctx) => {
      const commands: SlashCommandInfo[] = pi.getCommands();

      // Exclude BTW and its suffixed duplicates (e.g., btw:1)
      const filtered = commands.filter((c) => c.name.split(":")[0] !== "btw");

      const format = (items: SlashCommandInfo[]) => items.map((c) => `/${c.name}`).sort((a, b) => a.localeCompare(b));
      const bySource = (source: "extension" | "skill" | "prompt") => format(filtered.filter((c) => c.source === source));

      const exts = bySource("extension");
      const skills = bySource("skill");
      const prompts = bySource("prompt");

      const parts: string[] = [];
      if (exts.length) parts.push(`Extensions: ${exts.join(", ")}`);
      if (skills.length) parts.push(`Skills: ${skills.join(", ")}`);
      if (prompts.length) parts.push(`Prompts: ${prompts.join(", ")}`);
      const text = parts.join("\n\n").trim() || "(no commands found)";

      // Send as a normal assistant message so it reaches Telegram too
      pi.sendMessage({ customType: "extensions-list", content: text, display: true, details: { count: filtered.length } });
    },
  });
}

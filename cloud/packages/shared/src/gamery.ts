import type { Game, LibraryEntry, LibraryStatus, Platform } from "./index";

export interface GameryImportRecord {
  game: Game;
  entry: LibraryEntry;
}

export interface GameryImportResult {
  records: GameryImportRecord[];
  skippedRows: number;
  unknownStatuses: string[];
  sourceStatuses: Record<string, number>;
}

function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]!;
    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  return rows;
}

function gameryDate(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(
    /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/,
    "$1T$2$3:$4",
  );
  const date = new Date(normalized);
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString();
}

function numberInRange(value: string, minimum: number, maximum: number): number | undefined {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : undefined;
}

function stableNegativeID(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return -((hash >>> 0) % 2_000_000_000 + 1);
}

export function mapGameryStatus(value: string): LibraryStatus {
  const status = value.trim().toLowerCase();
  if (status.includes("abandon") || status.includes("drop")) return "dropped";
  if (status.includes("complete") || status.includes("beat") || status.includes("finish")) return "completed";
  if (status.includes("playing") || status.includes("current") || status.includes("ongoing")) return "playing";
  if (status.includes("wish") || status.includes("want") || status.includes("plan")) return "wishlist";
  return "backlog";
}

export function parseGameryCSV(text: string): GameryImportResult {
  const [headerRow, ...dataRows] = csvRows(text);
  if (!headerRow) throw new Error("The Gamery CSV is empty.");
  const headers = new Map(headerRow.map((header, index) => [header.trim(), index]));
  for (const required of ["IGDB ID", "Name", "Status"]) {
    if (!headers.has(required)) throw new Error(`This does not look like a Gamery export (missing ${required}).`);
  }

  const value = (row: string[], name: string): string => row[headers.get(name) ?? -1]?.trim() ?? "";
  const records: GameryImportRecord[] = [];
  const unknownStatuses = new Set<string>();
  const sourceStatuses: Record<string, number> = {};
  let skippedRows = 0;

  for (const row of dataRows) {
    const name = value(row, "Name");
    if (!name) {
      skippedRows += 1;
      continue;
    }
    const rawID = Number.parseInt(value(row, "IGDB ID"), 10);
    const markedCustom = value(row, "Custom Game (1=yes)") === "1";
    const isCustom = markedCustom || !Number.isSafeInteger(rawID) || rawID === 0;
    const addedAt = gameryDate(value(row, "Added Date")) ?? "1970-01-01T00:00:00.000Z";
    const completedAt = gameryDate(value(row, "Completed Date"));
    const updatedAt = completedAt && completedAt > addedAt ? completedAt : addedAt;
    const platformNames = value(row, "Library Platforms")
      .split(",")
      .map((platform) => platform.trim())
      .filter(Boolean);
    const platforms: Platform[] = platformNames.map((platform) => ({
      id: stableNegativeID(`platform:${platform}`),
      name: platform,
    }));
    const releaseDate = gameryDate(value(row, "First Release Date"));
    const ratingFive = numberInRange(value(row, "User Rating (1-5)"), 1, 5);
    const rawStatus = value(row, "Status");
    sourceStatuses[rawStatus || "(blank)"] = (sourceStatuses[rawStatus || "(blank)"] ?? 0) + 1;
    const status = mapGameryStatus(rawStatus);
    if (
      rawStatus
      && !/(abandon|drop|complete|beat|finish|playing|current|ongoing|wish|want|plan|backlog)/i.test(rawStatus)
    ) unknownStatuses.add(rawStatus);

    const game: Game = {
      id: isCustom ? stableNegativeID(`game:${name}:${addedAt}`) : rawID,
      name,
      ...(value(row, "Summary") ? { summary: value(row, "Summary") } : {}),
      ...(releaseDate ? { firstReleaseDate: Math.floor(Date.parse(releaseDate) / 1000) } : {}),
      ...(isCustom ? { isCustom: true } : {}),
      ...(value(row, "averageArtworkColor")
        ? { averageArtworkColor: value(row, "averageArtworkColor") }
        : {}),
      platforms,
      genres: [],
      releaseDates: [],
    };
    const storyProgress = numberInRange(value(row, "Story Progress (1-100)"), 0, 100);
    const overallProgress = numberInRange(value(row, "Overall Progress (1-100)"), 0, 100);
    const entry: LibraryEntry = {
      gameId: game.id,
      status,
      notes: "",
      ...(ratingFive ? { personalRating: ratingFive * 20 } : {}),
      ...(storyProgress !== undefined ? { storyProgress } : {}),
      ...(overallProgress !== undefined ? { overallProgress } : {}),
      ...(value(row, "User Review") ? { review: value(row, "User Review") } : {}),
      ...(completedAt ? { completedAt } : {}),
      ...(platformNames.length ? { libraryPlatforms: platformNames } : {}),
      ...(value(row, "importSources") ? { importSources: value(row, "importSources") } : {}),
      createdAt: addedAt,
      updatedAt,
    };
    records.push({ game, entry });
  }

  return {
    records,
    skippedRows,
    unknownStatuses: [...unknownStatuses].sort(),
    sourceStatuses,
  };
}

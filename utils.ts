import { CachedMetadata, TagCache } from "obsidian";

export interface BlockPosition {
	lineStart: number;
	lineEnd: number;
}

export const findBlocksWithTags = (
	cache: CachedMetadata
): { blocks: BlockPosition[]; sectionTags: TagCache[] } => {
	let blocks: BlockPosition[] = [];
	const sectionTags: TagCache[] = [];

	cache.sections?.forEach((section) => {
		const tag = cache.tags?.find(
			(t) =>
				t.position.start.line >= section.position.start.line &&
				t.position.start.line <= section.position.end.line
		);
		if (tag) {
			blocks.push({
				lineStart: section.position.start.line,
				lineEnd: section.position.end.line,
			});
			sectionTags.push(tag);
		}
	});
	cache.listItems?.forEach((item) => {
		const found = blocks.find(
			(block) =>
				block.lineEnd + 1 === item.position.start.line ||
				block.lineStart === item.position.end.line + 1
		);
		if (found) {
			const index = blocks.indexOf(found);
			blocks[index] = {
				lineStart:
					item.position.start.line < found.lineStart
						? item.position.start.line
						: found.lineStart,
				lineEnd:
					item.position.end.line > found.lineEnd
						? item.position.end.line
						: found.lineEnd,
			};
		}
	});
	console.log(blocks);
	return { blocks, sectionTags };
};

export const findBlockFileData = (
	tag: string,
	creationTime: number,
	blockText: string
) => {
	const output: string[] = [];
	output.push("---");
	output.push("category: " + tag);
	output.push("creationTime: " + creationTime);
	output.push("---");
	output.push("");
	output.push(blockText);
	return output.join("\n");
};

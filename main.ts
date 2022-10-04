import {
	App,
	Editor,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

import { findBlockFileData, findBlocksWithTags } from "utils";

interface BlockTagExtractorSettings {
	FOLDER_PATH: string;
	NUM_MAX_TITLE_WORDS: number;
}

const DEFAULT_SETTINGS: BlockTagExtractorSettings = {
	FOLDER_PATH: "_extracted_blocks",
	NUM_MAX_TITLE_WORDS: 15,
};

export default class BlockTagExtractor extends Plugin {
	settings: BlockTagExtractorSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "extract-blocks",
			name: "Extracts blocks that are labeled with a tag into new notes",
			editorCallback: async (editor: Editor, _view: MarkdownView) => {
				const file = this.app.workspace.getActiveFile();
				if (file) {
					const cache = this.app.metadataCache.getFileCache(file);
					if (cache) {
						const { blocks, sectionTags } =
							findBlocksWithTags(cache);

						const originalData = editor.getValue();
						let newData = originalData;
						for (let i = 0; i < blocks.length; i++) {
							const block = blocks[i];
							const blockText = editor.getRange(
								{
									line: block.lineStart,
									ch: 0,
								},
								{
									line: block.lineEnd + 1,
									ch: 0,
								}
							);
							const tag = sectionTags[i].tag;

							const folder = this.app.vault.getAbstractFileByPath(
								this.settings.FOLDER_PATH
							);
							if (!folder)
								await this.app.vault.createFolder(
									this.settings.FOLDER_PATH
								);

							const creationTime = file?.stat.ctime;
							console.log(blockText);
							const fileText = blockText.replace(tag, "");
							const fileData = findBlockFileData(
								tag.substring(1),
								creationTime,
								fileText
							);

							let fileName = fileText.split("\n")[0];
							const words = fileName.split(" ");
							fileName = words
								.filter(
									(_value, i) =>
										i <= this.settings.NUM_MAX_TITLE_WORDS
								)
								.join(" ");
							if (
								words.length > this.settings.NUM_MAX_TITLE_WORDS
							)
								fileName += "...";

							const filePath =
								this.settings.FOLDER_PATH + "/" + fileName;
							try {
								await this.app.vault.create(
									filePath + ".md",
									fileData
								);
							} catch (err) {
								await this.app.vault.create(
									filePath + " 1" + ".md",
									fileData
								);
							}
							newData = newData.replace(blockText, "");
						}
						await this.app.vault.modify(file, newData);
					}
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingsTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SettingsTab extends PluginSettingTab {
	plugin: BlockTagExtractor;

	constructor(app: App, plugin: BlockTagExtractor) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Extraction folder")
			.setDesc("The folder which the extracted block will be sent to")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.FOLDER_PATH)
					.onChange(async (value) => {
						this.plugin.settings.FOLDER_PATH = value;
						await this.plugin.saveSettings();
					})
			);
	}
}

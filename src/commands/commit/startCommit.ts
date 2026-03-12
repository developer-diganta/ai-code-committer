import chalk from 'chalk';
import { getProvider, log } from '../../utils/helper';
import {
  getAllBranches,
  getCurrentBranchName,
  getFilesChanged,
  getStagedDiff,
  gitFetch,
  gitCommit,
  unstageFiles,
} from '../../utils/git';
import { expandDirectories } from '../../utils/files';
import { buildCommitPrompt, buildCommitPromptGemma } from '../../utils/prompts';
import { filterNoiseFiles } from '../../utils/parser';
import { analyzeDiff } from '../../analyzers/analyzer';
import { compressBranchSummary } from '../../analyzers/compressBranchSummary';
import { generateWithGemma } from '../../ai/ollama';
import { generateWithGemini } from '../../ai/gemini';
import inquirer from 'inquirer';
// @ts-ignore
import { Input } from 'enquirer';
import ora from 'ora';

let provider = getProvider();

export default async (flags: any = {}) => {
  try {
    if (!provider) {
      throw new Error('No provider set');
    }

    const runProvider = flags.model ? flags.model : provider;

    console.log('');
    console.log(chalk.bold.bgBlue(' 🚀 AI-SHIP ') + chalk.bold.blue(' Commit Generator '));
    console.log(chalk.dim('==================================='));
    console.log('');

    // 1️⃣ Get staged files
    const scanSpinner = ora('Scanning staged files...').start();
    const filesChanged = await getFilesChanged();

    if (!filesChanged.length) {
      scanSpinner.fail(chalk.yellow('No staged files detected.'));
      return;
    }

    // 2️⃣ Expand directories
    const expandedFiles = expandDirectories(filesChanged);

    // 3️⃣ Extract filenames
    let filenames = expandedFiles.map((f) => f.file);

    // 4️⃣ Filter noise files
    filenames = filterNoiseFiles(filenames);

    scanSpinner.succeed(`Found ${filesChanged.length} staged file(s).`);

    console.log(chalk.dim('Files changed:'));
    filesChanged.forEach((f) => console.log(chalk.green(`  + ${f.file}`)));
    console.log('');

    // 5️⃣ Analyze diff
    const analyzeSpinner = ora('Analyzing changes and checking branches...').start();

    const diffs = await getStagedDiff(filenames);
    const diffSummary = analyzeDiff(diffs);

    await gitFetch();
    await getAllBranches();
    await getCurrentBranchName();

    compressBranchSummary(diffSummary);

    analyzeSpinner.succeed('Analysis complete.\n');

    // 6️⃣ Commit message generation
    let commitMessage = '';
    let commitAccepted = false;

    while (!commitAccepted) {
      const commitSpinner = ora('Generating commit message...').start();

      const prompt =
        runProvider === 'local'
          ? buildCommitPromptGemma(diffSummary)
          : buildCommitPrompt(diffSummary);

      commitMessage =
        runProvider === 'local'
          ? await generateWithGemma(prompt)
          : await generateWithGemini(prompt);

      commitSpinner.succeed('Commit message generated:\n');

      console.log(chalk.cyan(commitMessage));
      console.log('');

      // dry-run → exit early
      if (flags['dry-run']) {
        console.log(chalk.yellow('Dry run enabled. Commit not executed.\n'));
        await unstageFiles();
        return;
      }

      // skip prompt if --yes
      if (flags['yes']) {
        commitAccepted = true;
        break;
      }

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do with this commit message?',
          choices: ['Continue', 'Edit', 'Retry', 'Cancel'],
        },
      ]);

      if (action === 'Continue') {
        commitAccepted = true;
      } else if (action === 'Edit') {
        const promptInput = new Input({
          message: 'Edit your commit message:',
          initial: commitMessage,
        });

        commitMessage = (await promptInput.run()) as string;
        commitAccepted = true;
      } else if (action === 'Retry') {
        console.log(chalk.yellow('Retrying commit message...\n'));
      } else if (action === 'Cancel') {
        console.log(chalk.yellow('Commit cancelled.\n'));
        return;
      }
    }

    // 7️⃣ Commit
    const commitSpinner = ora('Committing changes...').start();
    await gitCommit(commitMessage);
    commitSpinner.succeed('Changes successfully committed!\n');
  } catch (err) {
    if ((err as Error).name === 'ExitPromptError') {
      console.log(chalk.yellow('\nProcess aborted using user prompt.\n'));
      return;
    }

    log(chalk.red(`We ran into an error: ${err}`));
  }
};

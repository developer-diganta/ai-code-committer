// 8️⃣ Branch Name Loop
// let branchName = '';
// let branchAccepted = false;

// while (!branchAccepted) {
//   const branchSpinner = ora('Generating branch name...').start();
//   if (provider === 'local') {
//     const branchNamePrompt = buildBranchPromptGemma(
//       branchSummary,
//       allBranches,
//       currentBranch,
//       commitMessage,
//     );
//     const responseBranch = await generateWithGemma(branchNamePrompt);
//     branchName = (responseBranch.text || '').trim().replace(/['"]/g, '');
//   } else {
//     const branchNamePrompt = buildBranchPrompt(
//       branchSummary,
//       allBranches,
//       currentBranch,
//       commitMessage,
//     );
//     branchName = await generateWithGemini(branchNamePrompt);
//   }
//   branchSpinner.succeed('Branch name generated:\n');

//   console.log(chalk.magenta(branchName));
//   console.log('');

//   const { action } = await inquirer.prompt([
//     {
//       type: 'list',
//       name: 'action',
//       message: 'What would you like to do with this branch name?',
//       choices: ['Continue', 'Edit', 'Retry'],
//     },
//   ]);

//   if (action === 'Continue') {
//     branchAccepted = true;
//   } else if (action === 'Edit') {
//     const promptInput = new Input({
//       message: 'Edit your branch name:',
//       initial: branchName,
//     });
//     branchName = (await promptInput.run()) as string;
//     branchAccepted = true;
//   } else if (action === 'Retry') {
//     console.log(chalk.yellow('Retrying branch name...'));
//     console.log('');
//   }
// }

// // 9️⃣ Rename Branch
// const branchProcessSpinner = ora('Applying branch name...').start();
// await gitRenameBranch(branchName);
// branchProcessSpinner.succeed(`Branch correctly renamed to ${chalk.bold(branchName)}!`);

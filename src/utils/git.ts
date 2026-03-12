import asyncExecuter from './asyncExecuter';
export const getFilesChanged = async (fromStaged: boolean = false) => {
  const { stdout: filesChanged } = await asyncExecuter('git diff --cached --name-status');

  if (!filesChanged.trim()) return [];

  return filesChanged
    .trim()
    .split('\n')
    .map((line) => {
      const [status, file] = line.split('\t');

      return {
        status: status.trim(),
        file: file.trim().replace(/^[.\\/]+/, ''),
      };
    });
};
export const stageAll = async () => {
  await asyncExecuter('git add .');
};

export const stageFiles = async (files: string[]) => {
  if (!files || files.length === 0) return;

  const filesString = files.map((f) => `"${f}"`).join(' ');
  console.log({ filesString });
  await asyncExecuter(`git add ${filesString}`);
};

export const getStagedDiff = async (files: string[]) => {
  const filesString = files.map((f) => `"${f}"`).join(' ');

  const { stdout } = await asyncExecuter(`git diff --cached -- ${filesString}`);

  return stdout;
};

export const gitFetch = async () => {
  return await asyncExecuter('git fetch --all');
};

export const getAllBranches = async () => {
  const { stdout: raw } = await asyncExecuter('git branch -a');

  const branches = raw
    .split('\n')
    .map((b) => b.replace('*', '').trim()) // remove *
    .map((b) => b.replace('remotes/origin/', '')) // normalize remote
    .filter(Boolean);

  return [...new Set(branches)]; // remove duplicates
};

export const getCurrentBranchName = async () => {
  return (await asyncExecuter('git branch --show-current')).stdout;
};

export const gitCommit = async (message: string) => {
  // Use spawn equivalent or escape carefully if needed,
  // but asyncExecuter just uses child_process.exec.
  // Escaping quotes for shell:
  const escapedMessage = message.replace(/"/g, '\\"');
  await asyncExecuter(`git commit -m "${escapedMessage}"`);
};

export const gitRenameBranch = async (branchName: string) => {
  await asyncExecuter(`git branch -m "${branchName}"`);
};

export const unstageFiles = async () => {
  await asyncExecuter(`git reset HEAD~1`);
};

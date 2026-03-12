import ora from 'ora';
import startCommit from '../commands/commit/startCommit';
import { stageAll, stageFiles, unstageFiles } from './git';
import chalk from 'chalk';

export default async (payload: string[] = [], flags: any = {}) => {
  const stageSpinner = ora('Staging files...').start();
  console.log({ payload }, { flags });
  if (payload.length > 0) {
    await stageFiles(payload);
    stageSpinner.succeed(`Staged ${payload.length} specified file(s).`);
  } else {
    await stageAll();
    stageSpinner.succeed('Staged all changes.');
  }

  console.log('');

  await startCommit(flags);
};

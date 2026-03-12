type DiffSummary = {
  file: string;
  additions: number;
  deletions: number;
  signals: string[];
  snippet: string[];
};

export const compressBranchSummary = (summary: DiffSummary[]) => {
  return summary
    .slice(0, 8) // limit files
    .map((s) => ({
      file: s.file,
      signals: s.signals,
    }));
};

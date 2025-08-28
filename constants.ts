import type { Criterion } from './types';

export const CRITERIA: Criterion[] = [
  { id: 'c1', name: 'Problem Clarity', weight: 0.20 },
  { id: 'c2', name: 'Structure of Policy Proposal', weight: 0.10 },
  { id: 'c3', name: 'Solution Innovativeness & Feasibility', weight: 0.30 },
  { id: 'c4', name: 'Potential Impact', weight: 0.25 },
  { id: 'c5', name: 'Clarity of Implementation Plan', weight: 0.10 },
  { id: 'c6', name: 'Overall Presentation', weight: 0.05 },
];

// IMPORTANT: Replace this with the actual URL of your Google Doc scoring rubric.
// Make sure the document is viewable by anyone with the link.
export const SCORING_RUBRIC_URL = 'https://docs.google.com/document/d/1FmKUdbpfIr7n3zxoa7upK0ZE8M8xMux5AXrM6bIKCpc/edit?tab=t.0';
export const PROPOSAL_GUIDELINES_URL = 'https://docs.google.com/document/d/13_7G37wRJ3mT57K3xljSz-kiuNj9pPKrO8hYUQAAeJg/edit?tab=t.0';

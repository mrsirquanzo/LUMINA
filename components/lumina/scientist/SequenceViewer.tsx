"use client";

import { Company } from '@/lib/lumina/types';
import { Dna, Code } from 'lucide-react';

interface SequenceViewerProps {
  company: Company;
}

export default function SequenceViewer({ company }: SequenceViewerProps) {
  const sequenceData = company.sequenceData || {
    proteinSequence: 'MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPVLEDAFELSSMGIRVDADTLKHQLALTGDEDRLELEWHQALLRGEMPQTIGGGIGQSRLTMLLLQLPHIGQVQAGVWPAAVRESVPSLL',
    dnaSequence: 'ATGAAGACAGCTTACATCGCCAAACAGCGGCAGATCTCCGTTAAATCCCAACATTTCTCCCGGCAGCTGGAGGAGCGACTGGGCCTGATCGAGGTGCAGGCCCCCATCCTGTCCCGAGTGGGCGACGGGACCCAGGACAACCTGTCCGGCGCCGAGAAGGCCGTGCAGGTGAAGGTGAAGGCCCTGCCTGACGCCCAGTTTGAGGTGGTGCACTCGCTGGCCAAGTGGAAGCAGACACTGGGGCAGCATGACTTCAGCGCCGGCGAGGGGCTGTACACCCACATGAAGGCCCTGCGCCCCGACGAGGACCGACTGTCGCCGCTGCACTCGGTGTACGTGGACCAGTGGAACTGGGAGCGAGTGATGGGCGACGGCGAGCGGCAGTTCTCGACACTGAAGTCGACCGTCGAGGCCATCTGGGCCGGCATCAAGGCCACCGAGGCCGCCGTGTCGGAGGAGTTTGGGCTGGCCCCGTTTCTGCCTGACCAGATCCACTTCGTGCACTCGCAGGAGCTGCTGTCCCGCTACCCCGACCTGGACGCCAAGGGCCGCGAGCGAGCCATCGCCAAGGACCTGGGCGCCGTGTTCCTGGTGGGCATCGGCGGCAAACTGTCGGACGGCCACCGGCACGACGTGCGCGCCCCCGACTACGACGACTGGTCGACCCCGTCGGAGCTGGGCCACGCCGGCCTGAACGGGGACATCCTGGTGTGGAACCCGGTGCTGGAGGACGCCGTTGAGCTGTCGTCGATGGGCATCCGCGTGGACGCCGACACACTGAAGCACCAGCTGGCCCTGACCGGCGACGAGGACCGACTGGAGCTGGAGTGGCACCAGGCCCTGCTGCGCGGCGAGATGCCTCAGACCATCGGCGGCGGCATCGGCGGCAGTCGCCGCACCATGCTGCTGCTGCAGCTGCCCCACATCGGCGGCAGGTGCAGGCCGGCGTGTGGCCGGCCGCCGTGCGCGAGTCGGTGCCGTCGCTGCTG',
    mutations: ['V600E', 'L858R'],
    domains: ['Extracellular Domain', 'Transmembrane Domain', 'Intracellular Domain'],
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Dna className="w-5 h-5 text-scientist-primary-400" />
          Protein Sequence
        </h3>
        <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto">
          <div className="whitespace-pre-wrap break-all">{sequenceData.proteinSequence}</div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Code className="w-5 h-5 text-scientist-primary-400" />
          DNA Sequence
        </h3>
        <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto">
          <div className="whitespace-pre-wrap break-all">{sequenceData.dnaSequence}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Key Mutations</h3>
          <div className="space-y-2">
            {sequenceData.mutations.map((mutation, idx) => (
              <div key={idx} className="px-3 py-2 bg-slate-800/50 rounded-md border border-scientist-primary-500/30">
                <span className="text-slate-200 font-mono">{mutation}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Protein Domains</h3>
          <div className="space-y-2">
            {sequenceData.domains.map((domain, idx) => (
              <div key={idx} className="px-3 py-2 bg-slate-800/50 rounded-md">
                <span className="text-slate-200">{domain}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

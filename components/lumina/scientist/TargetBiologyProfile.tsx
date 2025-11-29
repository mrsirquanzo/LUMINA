"use client";

import { Company } from '@/lib/lumina/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { Calendar, Dna } from 'lucide-react';

interface TargetBiologyProfileProps {
  company: Company;
}

export default function TargetBiologyProfile({ company }: TargetBiologyProfileProps) {
  if (!company.target) return null;

  return (
    <div className="mb-6 bg-slate-900/50 rounded-xl border border-violet-500/30 p-6">
      <Accordion type="single" collapsible defaultValue="target-biology" className="w-full">
        <AccordionItem value="target-biology" className="border-none">
          <AccordionTrigger className="hover:no-underline px-0">
            <div className="flex items-center gap-3">
              <Dna className="w-5 h-5 text-scientist-primary-400" />
              <h3 className="text-lg font-semibold text-slate-100">
                Target Biology Profile: <span className="text-scientist-primary-400">{company.target}</span>
              </h3>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Left Column - Biology Summary */}
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                  Biology Summary
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {company.targetBiology || 
                    `${company.target} is a cell adhesion molecule that plays a critical role in cell-cell interactions. 
                    It is overexpressed in various cancer types, making it an attractive therapeutic target. 
                    The protein's extracellular domain mediates binding to its ligands, while its intracellular 
                    domain interacts with signaling pathways that promote cell survival and proliferation.`}
                </p>
              </div>

              {/* Right Column - Discovery Timeline */}
              <div className="relative pl-4 border-l border-slate-700">
                <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
                  Discovery Timeline
                </h4>
                <div className="space-y-4">
                  {(company.discoveryTimeline || [
                    { date: '1995', event: 'Initial identification in cell adhesion studies' },
                    { date: '2003', event: 'Role in cancer progression established' },
                    { date: '2010', event: 'First therapeutic targeting attempts' },
                    { date: '2018', event: 'Clinical validation in multiple indications' },
                  ]).map((event, index) => (
                    <div key={index} className="flex items-start gap-3 relative">
                      <div className="absolute -left-6 flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-scientist-primary-500 border-2 border-slate-800" />
                        {index < (company.discoveryTimeline?.length || 4) - 1 && (
                          <div className="w-0.5 h-full bg-slate-700 mt-1 min-h-[50px]" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3 h-3 text-scientist-primary-400" />
                          <span className="text-xs font-semibold text-scientist-primary-400">
                            {event.date}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300">{event.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}


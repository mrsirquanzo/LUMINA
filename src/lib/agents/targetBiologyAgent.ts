/**
 * Target Biology Agent
 * Orchestrates API clients to assess biological validity and druggability.
 * Uses LLM for synthesis and interpretation.
 */
import { OpenTargetsClient } from '../clients/biology/openTargetsClient';
import { GnomadClient } from '../clients/biology/gnomadClient';
import { ChEMBLClient } from '../clients/biology/chemblClient';
import { UniProtClient } from '../clients/biology/uniprotClient';
import { PubMedClient } from '../clients/biology/pubmedClient';
import { createLLMClient } from '../llm/clientFactory';
import type { ILLMClient, LLMClientConfig } from '../llm/types';
import type {
  TargetAssessmentReport,
  GeneticEvidence,
  GeneticAssociation,
  DruggabilityAssessment,
  LiteratureSynthesis,
  SafetyAssessment,
  EvidenceStrength,
  AssessmentDepth,
  Publication,
  ChemicalMatter,
} from '../models/biology/targetBiology';

export class TargetBiologyAgent {
  private openTargets: OpenTargetsClient;
  private gnomad: GnomadClient;
  private chembl: ChEMBLClient;
  private uniprot: UniProtClient;
  private pubmed: PubMedClient;
  private llm?: ILLMClient;

  constructor(llmConfig?: LLMClientConfig) {
    this.openTargets = new OpenTargetsClient();
    this.gnomad = new GnomadClient();
    this.chembl = new ChEMBLClient();
    this.uniprot = new UniProtClient();
    this.pubmed = new PubMedClient(process.env.NCBI_API_KEY);
    
    if (llmConfig) {
      this.llm = createLLMClient(llmConfig);
    }
  }

  /**
   * Main entry point for target assessment.
   * Runs all assessments in parallel where possible.
   */
  async assessTarget(
    targetSymbol: string,
    options: {
      indication?: string;
      depth?: AssessmentDepth;
    } = {}
  ): Promise<TargetAssessmentReport> {
    const { indication, depth = 'standard' } = options;

    console.log(`[TargetBiologyAgent] Assessing ${targetSymbol}...`);

    // Run independent assessments in parallel
    const [geneticEvidence, druggability, literature] = await Promise.all([
      this.getGeneticEvidence(targetSymbol, indication).catch(err => {
        console.error('[TargetBiologyAgent] Genetic evidence failed:', err);
        return null;
      }),
      this.getDruggability(targetSymbol).catch(err => {
        console.error('[TargetBiologyAgent] Druggability failed:', err);
        return null;
      }),
      this.getMechanisticLiterature(targetSymbol, indication, depth).catch(err => {
        console.error('[TargetBiologyAgent] Literature failed:', err);
        return null;
      }),
    ]);

    // Safety depends on genetic evidence
    const safety = await this.getSafetySignals(targetSymbol, geneticEvidence).catch(err => {
      console.error('[TargetBiologyAgent] Safety assessment failed:', err);
      return null;
    });

    // Synthesize report with LLM
    const report = await this.synthesizeReport(
      targetSymbol,
      indication ?? null,
      geneticEvidence,
      druggability,
      literature,
      safety
    );

    return report;
  }

  /**
   * Answer a specific query about a target using the assessment report.
   */
  async answerQuery(
    query: string,
    report: TargetAssessmentReport
  ): Promise<string> {
    if (!this.llm) {
      // Fallback: search report for relevant info
      return this.fallbackAnswerQuery(query, report);
    }

    const prompt = `You are a target biology expert. Answer the following question about ${report.targetSymbol} based on this assessment report:

Question: ${query}

Assessment Report:
${JSON.stringify(report, null, 2)}

Provide a concise, accurate answer with specific metrics and citations where relevant.`;

    const response = await this.llm.sendMessage(
      'You are a target biology specialist. Provide accurate, cited answers based on the assessment data.',
      prompt,
      { maxTokens: 2048 }
    );

    return response.content;
  }

  private fallbackAnswerQuery(query: string, report: TargetAssessmentReport): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('genetic') || lowerQuery.includes('validation')) {
      return report.geneticEvidence?.summary || 'Genetic validation data not available.';
    }
    
    if (lowerQuery.includes('drugg') || lowerQuery.includes('compound')) {
      return report.druggability?.druggabilitySummary || 'Druggability data not available.';
    }
    
    if (lowerQuery.includes('safety') || lowerQuery.includes('risk')) {
      return report.safety?.safetySummary || 'Safety assessment not available.';
    }
    
    return report.executiveSummary || 'Assessment data not available.';
  }

  /**
   * Query Open Targets and gnomAD for human genetic validation.
   */
  async getGeneticEvidence(
    targetSymbol: string,
    indication?: string
  ): Promise<GeneticEvidence> {
    // Get target ID from Open Targets
    const targetInfo = await this.openTargets.getTargetInfo(targetSymbol);
    if (!targetInfo) {
      return {
        targetSymbol,
        associations: [],
        constraint: null,
        mendelianDiseases: [],
        overallValidationScore: 0,
        validationStrength: 'insufficient',
        summary: `Target ${targetSymbol} not found in Open Targets database.`,
      };
    }

    // Fetch data in parallel
    const [associations, constraintData] = await Promise.all([
      this.openTargets.getDiseaseAssociations(targetInfo.id, { indication }),
      this.gnomad.getGeneConstraint(targetSymbol),
    ]);

    // Parse associations
    const geneticAssociations: GeneticAssociation[] = associations.map(a => ({
      disease: a.diseaseName,
      diseaseId: a.diseaseId,
      score: a.score,
      evidenceTypes: a.evidenceTypes,
      keyVariants: [],
      publications: [],
    }));

    // Process constraint metrics
    const constraint: { pli: number | null; loeuf: number | null; misZ: number | null; lofVariantsObserved: number; lofHomozygotes: number; interpretation: string } | null = constraintData
      ? this.gnomad.interpretConstraint(constraintData)
      : null;

    // Calculate overall validation score
    const overallScore = this.calculateValidationScore(geneticAssociations, constraint);
    const validationStrength = this.scoreToStrength(overallScore);

    // Generate summary with LLM or fallback
    const summary = await this.generateGeneticSummary(
      targetSymbol,
      geneticAssociations,
      constraint,
      validationStrength
    );

    return {
      targetSymbol,
      associations: geneticAssociations,
      constraint,
      mendelianDiseases: [],
      overallValidationScore: overallScore,
      validationStrength,
      summary,
    };
  }

  /**
   * Query ChEMBL, UniProt for tractability assessment.
   */
  async getDruggability(targetSymbol: string): Promise<DruggabilityAssessment> {
    // Fetch data in parallel
    const [proteinInfo, chemblTarget, openTargetsInfo] = await Promise.all([
      this.uniprot.getProteinInfo(targetSymbol),
      this.chembl.searchTarget(targetSymbol),
      this.openTargets.getTargetInfo(targetSymbol),
    ]);

    let tractability = null;
    let existingCompounds: ChemicalMatter[] = [];

    if (openTargetsInfo) {
      tractability = await this.openTargets.getTractability(openTargetsInfo.id);
    }

    if (chemblTarget) {
      existingCompounds = await this.chembl.getTargetCompounds(chemblTarget.targetChemblId);
    }

    const proteinClass = proteinInfo
      ? this.uniprot.classifyProtein(proteinInfo)
      : 'Unknown';

    // Determine tractability bucket
    const tractabilityBucket = this.determineTractabilityBucket(
      proteinClass,
      tractability,
      existingCompounds
    );

    // Determine recommended modalities
    const recommendedModalities = this.recommendModalities(
      proteinClass,
      proteinInfo?.subcellularLocations ?? []
    );

    // Generate summary
    const summary = await this.generateDruggabilitySummary(
      targetSymbol,
      proteinClass,
      tractabilityBucket,
      existingCompounds,
      recommendedModalities
    );

    return {
      targetSymbol,
      uniprotId: proteinInfo?.uniprotId ?? '',
      proteinClass,
      subcellularLocation: proteinInfo?.subcellularLocations ?? [],
      hasStructure: (proteinInfo?.pdbIds?.length ?? 0) > 0,
      pdbIds: proteinInfo?.pdbIds ?? [],
      alphafoldConfidence: null,
      existingCompounds,
      tractabilityBucket,
      recommendedModalities,
      druggabilitySummary: summary,
    };
  }

  /**
   * Query PubMed and synthesize mechanistic understanding.
   */
  async getMechanisticLiterature(
    targetSymbol: string,
    indication?: string,
    depth: AssessmentDepth = 'standard'
  ): Promise<LiteratureSynthesis> {
    const maxResults = depth === 'quick' ? 20 : depth === 'comprehensive' ? 100 : 50;

    // Fetch different types of publications in parallel
    const [mechanistic, preclinical] = await Promise.all([
      this.pubmed.searchMechanisticPublications(targetSymbol, indication, maxResults / 2),
      this.pubmed.searchPreclinicalPublications(targetSymbol, indication, maxResults / 2),
    ]);

    // Combine and deduplicate by PMID
    const allPubs = [...mechanistic, ...preclinical];
    const uniquePubs = Array.from(
      new Map(allPubs.map(p => [p.pmid, p])).values()
    );

    // Sort by year (most recent first) and take top publications
    const keyPublications = uniquePubs
      .sort((a, b) => b.year - a.year)
      .slice(0, 10);

    // Analyze publication trend
    const publicationTrend = this.analyzePublicationTrend(uniquePubs);

    // Extract key researchers
    const keyResearchers = this.extractKeyResearchers(uniquePubs);

    // Generate syntheses with LLM
    const [mechanisticSummary, preclinicalEvidence, evidenceGaps] = await Promise.all([
      this.generateMechanisticSummary(targetSymbol, indication, keyPublications),
      this.generatePreclinicalSummary(targetSymbol, indication, preclinical),
      this.identifyEvidenceGaps(targetSymbol, indication, keyPublications),
    ]);

    return {
      targetSymbol,
      indication: indication ?? null,
      totalPublications: uniquePubs.length,
      publicationTrend,
      keyPublications,
      mechanisticSummary,
      preclinicalEvidence,
      keyResearchers,
      evidenceGaps,
    };
  }

  /**
   * Assess mechanism-based safety from genetic and literature evidence.
   */
  async getSafetySignals(
    targetSymbol: string,
    geneticEvidence: GeneticEvidence | null
  ): Promise<SafetyAssessment> {
    const geneticSafetySignals: string[] = [];
    const mechanismBasedRisks: string[] = [];

    // Analyze genetic constraint for safety signals
    if (geneticEvidence?.constraint) {
      const constraint = geneticEvidence.constraint;
      if (constraint.pli !== null && constraint.pli > 0.9) {
        geneticSafetySignals.push(
          'High genetic constraint (pLI > 0.9) suggests essential gene function - complete inhibition may have safety concerns'
        );
      }

      if (constraint.lofHomozygotes === 0) {
        geneticSafetySignals.push(
          'No homozygous LoF carriers observed in gnomAD - complete loss of function may not be tolerated'
        );
      } else if (constraint.lofHomozygotes > 10) {
        geneticSafetySignals.push(
          `${constraint.lofHomozygotes} homozygous LoF carriers observed - suggests complete inhibition may be tolerated`
        );
      }
    }

    // Get protein info for expression concerns
    const proteinInfo = await this.uniprot.getProteinInfo(targetSymbol);
    const broadExpressionConcern = this.assessExpressionBreadth(proteinInfo);

    const expressionTissues = proteinInfo?.subcellularLocations ?? [];

    // Generate safety summary
    const safetySummary = await this.generateSafetySummary(
      targetSymbol,
      geneticSafetySignals,
      broadExpressionConcern,
      mechanismBasedRisks
    );

    return {
      targetSymbol,
      geneticSafetySignals,
      broadExpressionConcern,
      expressionTissues,
      mechanismBasedRisks,
      safetySummary,
    };
  }

  /**
   * Synthesize final report with LLM.
   */
  private async synthesizeReport(
    targetSymbol: string,
    indication: string | null,
    geneticEvidence: GeneticEvidence | null,
    druggability: DruggabilityAssessment | null,
    literature: LiteratureSynthesis | null,
    safety: SafetyAssessment | null
  ): Promise<TargetAssessmentReport> {
    // Generate executive summary
    const executiveSummary = await this.generateExecutiveSummary(
      targetSymbol,
      indication,
      geneticEvidence,
      druggability,
      literature,
      safety
    );

    // Compile key risks
    const keyRisks = this.compileKeyRisks(geneticEvidence, druggability, safety);

    // Compile next steps
    const nextSteps = this.compileNextSteps(geneticEvidence, druggability, literature);

    // Determine overall recommendation
    const overallRecommendation = this.determineRecommendation(
      geneticEvidence,
      druggability,
      safety
    );

    return {
      targetSymbol,
      indication,
      assessmentDate: new Date().toISOString().split('T')[0],
      geneticEvidence,
      druggability,
      literature,
      safety,
      overallRecommendation,
      keyRisks,
      nextSteps,
      executiveSummary,
    };
  }

  // Helper methods
  private calculateValidationScore(
    associations: GeneticAssociation[],
    constraint: { pli: number | null; loeuf: number | null } | null
  ): number {
    let score = 0;

    // Score based on associations
    const topAssociationScore = Math.max(...associations.map(a => a.score), 0);
    score += topAssociationScore * 0.5;

    // Score based on evidence diversity
    const allEvidenceTypes = new Set(associations.flatMap(a => a.evidenceTypes));
    score += Math.min(allEvidenceTypes.size * 0.1, 0.3);

    // Score based on constraint (inverted - high constraint = more validated but riskier)
    if (constraint?.pli !== null && constraint?.pli !== undefined) {
      score += constraint.pli * 0.2;
    }

    return Math.min(score, 1);
  }

  private scoreToStrength(score: number): EvidenceStrength {
    if (score >= 0.7) return 'strong';
    if (score >= 0.4) return 'moderate';
    if (score >= 0.2) return 'limited';
    return 'insufficient';
  }

  private determineTractabilityBucket(
    proteinClass: string,
    tractability: { smallMolecule?: { topCategory?: string }; antibody?: { topCategory?: string } } | null,
    existingCompounds: ChemicalMatter[]
  ): string {
    if (existingCompounds.some(c => c.maxPhase >= 4)) {
      return 'Approved drugs exist';
    }
    if (existingCompounds.some(c => c.maxPhase >= 2)) {
      return 'Clinical-stage compounds exist';
    }
    if (existingCompounds.length > 0) {
      return 'Preclinical compounds exist';
    }
    if (tractability?.smallMolecule?.topCategory === 'Clinical_Precedence') {
      return 'High tractability (clinical precedence)';
    }
    if (['Kinase', 'GPCR', 'Ion Channel', 'Nuclear Receptor'].includes(proteinClass)) {
      return 'Tractable protein class';
    }
    return 'Novel target - tractability uncertain';
  }

  private recommendModalities(
    proteinClass: string,
    subcellularLocations: string[]
  ): string[] {
    const modalities: string[] = [];
    const isMembraneOrSecreted =
      subcellularLocations.some(l => l.toLowerCase().includes('membrane')) ||
      subcellularLocations.some(l => l.toLowerCase().includes('secreted'));

    if (['Kinase', 'GPCR', 'Ion Channel', 'Nuclear Receptor', 'Protease'].includes(proteinClass)) {
      modalities.push('Small molecule');
    }
    if (isMembraneOrSecreted) {
      modalities.push('Monoclonal antibody');
      modalities.push('ADC');
      modalities.push('Bispecific antibody');
    }
    modalities.push('RNA-based (ASO/siRNA)');
    if (proteinClass === 'Kinase') {
      modalities.push('PROTAC/degrader');
    }
    return modalities;
  }

  private analyzePublicationTrend(publications: Publication[]): string {
    if (publications.length === 0) return 'No publications found';
    const currentYear = new Date().getFullYear();
    const recentCount = publications.filter(p => p.year >= currentYear - 3).length;
    const olderCount = publications.filter(
      p => p.year >= currentYear - 6 && p.year < currentYear - 3
    ).length;

    if (recentCount > olderCount * 1.5) return 'Increasing';
    if (recentCount < olderCount * 0.5) return 'Declining';
    return 'Stable';
  }

  private extractKeyResearchers(publications: Publication[]): string[] {
    const authorCounts = new Map<string, number>();
    for (const pub of publications) {
      const firstAuthor = pub.authors.split(',')[0]?.trim();
      if (firstAuthor) {
        authorCounts.set(firstAuthor, (authorCounts.get(firstAuthor) ?? 0) + 1);
      }
    }
    return Array.from(authorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([author]) => author);
  }

  private assessExpressionBreadth(protein: { keywords: string[] } | null): boolean {
    if (!protein) return false;
    const broadExpressionKeywords = ['ubiquitous', 'housekeeping', 'essential'];
    return protein.keywords.some(k =>
      broadExpressionKeywords.some(bk => k.toLowerCase().includes(bk))
    );
  }

  private compileKeyRisks(
    genetic: GeneticEvidence | null,
    druggability: DruggabilityAssessment | null,
    safety: SafetyAssessment | null
  ): string[] {
    const risks: string[] = [];
    if (genetic?.validationStrength === 'insufficient' || genetic?.validationStrength === 'limited') {
      risks.push('Limited human genetic validation');
    }
    if (druggability?.existingCompounds.length === 0) {
      risks.push('No existing chemical matter - novel target');
    }
    if (safety?.broadExpressionConcern) {
      risks.push('Broad tissue expression may lead to on-target toxicity');
    }
    if (safety?.geneticSafetySignals.some(s => s.includes('essential'))) {
      risks.push('High genetic constraint suggests essential function');
    }
    return risks;
  }

  private compileNextSteps(
    genetic: GeneticEvidence | null,
    druggability: DruggabilityAssessment | null,
    literature: LiteratureSynthesis | null
  ): string[] {
    const steps: string[] = [];
    if (genetic?.validationStrength !== 'strong') {
      steps.push('Conduct additional target validation studies (CRISPR KO, RNAi)');
    }
    if (!druggability?.hasStructure) {
      steps.push('Obtain protein structure (X-ray, cryo-EM, or AlphaFold)');
    }
    if (druggability?.existingCompounds.length === 0) {
      steps.push('Initiate hit-finding campaign (HTS, virtual screen, fragment)');
    }
    if (literature?.evidenceGaps.length) {
      steps.push(`Address evidence gaps: ${literature.evidenceGaps[0]}`);
    }
    return steps;
  }

  private determineRecommendation(
    genetic: GeneticEvidence | null,
    druggability: DruggabilityAssessment | null,
    safety: SafetyAssessment | null
  ): string {
    const geneticScore = genetic?.overallValidationScore ?? 0;
    const hasDrugs = (druggability?.existingCompounds.length ?? 0) > 0;
    const safetyRisks = safety?.geneticSafetySignals.length ?? 0;

    if (geneticScore >= 0.7 && hasDrugs && safetyRisks < 2) {
      return 'Strong candidate - recommend advancing';
    }
    if (geneticScore >= 0.4 || hasDrugs) {
      return 'Promising candidate - recommend further validation';
    }
    if (geneticScore > 0) {
      return 'Early-stage candidate - significant validation needed';
    }
    return 'Insufficient evidence - not recommended at this time';
  }

  // LLM-powered generation methods
  private async generateGeneticSummary(
    targetSymbol: string,
    associations: GeneticAssociation[],
    constraint: { interpretation: string } | null,
    strength: EvidenceStrength
  ): Promise<string> {
    if (!this.llm) {
      const assocSummary =
        associations.length > 0
          ? `Associated with ${associations.length} diseases, top association score: ${associations[0]?.score.toFixed(2)}`
          : 'No significant disease associations found';
      return `${targetSymbol}: ${strength} genetic validation. ${assocSummary}. ${constraint?.interpretation ?? ''}`;
    }

    const prompt = `Summarize the genetic evidence for ${targetSymbol} as a therapeutic target in 2-3 sentences.

Disease associations: ${JSON.stringify(associations.slice(0, 5))}
Constraint metrics: ${constraint?.interpretation ?? 'Not available'}
Overall strength: ${strength}

Focus on: validation quality, key disease links, and constraint implications for druggability.`;

    const response = await this.llm.sendMessage(
      'You are a target biology expert. Provide concise, accurate summaries.',
      prompt,
      { maxTokens: 512 }
    );

    return response.content;
  }

  private async generateDruggabilitySummary(
    targetSymbol: string,
    proteinClass: string,
    tractabilityBucket: string,
    existingCompounds: ChemicalMatter[],
    recommendedModalities: string[]
  ): Promise<string> {
    if (!this.llm) {
      const compoundSummary =
        existingCompounds.length > 0
          ? `${existingCompounds.length} compounds identified (max phase: ${Math.max(...existingCompounds.map(c => c.maxPhase))})`
          : 'No existing compounds';
      return `${targetSymbol} is a ${proteinClass}. ${tractabilityBucket}. ${compoundSummary}. Recommended modalities: ${recommendedModalities.join(', ')}.`;
    }

    const prompt = `Summarize the druggability assessment for ${targetSymbol} in 2-3 sentences.

Protein class: ${proteinClass}
Tractability: ${tractabilityBucket}
Existing compounds: ${JSON.stringify(existingCompounds.slice(0, 3))}
Recommended modalities: ${recommendedModalities.join(', ')}

Focus on: tractability, existing drug development efforts, and recommended approaches.`;

    const response = await this.llm.sendMessage(
      'You are a target biology expert. Provide concise, accurate summaries.',
      prompt,
      { maxTokens: 512 }
    );

    return response.content;
  }

  private async generateMechanisticSummary(
    targetSymbol: string,
    indication: string | undefined,
    publications: Publication[]
  ): Promise<string> {
    if (!this.llm || publications.length === 0) {
      return `Based on ${publications.length} publications analyzed for ${targetSymbol}${indication ? ` in ${indication}` : ''}.`;
    }

    const abstracts = publications
      .slice(0, 5)
      .map(p => `[${p.pmid}] ${p.title}: ${p.abstract.slice(0, 500)}`)
      .join('\n\n');

    const prompt = `Synthesize the mechanistic understanding of ${targetSymbol}${indication ? ` in ${indication}` : ''} based on these publications:

${abstracts}

Provide a 3-4 sentence summary of: the target's biological function, disease relevance, and key mechanistic insights.`;

    const response = await this.llm.sendMessage(
      'You are a target biology expert. Synthesize mechanistic understanding from literature.',
      prompt,
      { maxTokens: 1024 }
    );

    return response.content;
  }

  private async generatePreclinicalSummary(
    targetSymbol: string,
    indication: string | undefined,
    publications: Publication[]
  ): Promise<string> {
    if (!this.llm || publications.length === 0) {
      return `Limited preclinical evidence available for ${targetSymbol}.`;
    }

    const prompt = `Summarize the preclinical evidence for targeting ${targetSymbol}${indication ? ` in ${indication}` : ''} in 2-3 sentences based on ${publications.length} publications. Focus on: animal models, efficacy signals, and translational potential.`;

    const response = await this.llm.sendMessage(
      'You are a target biology expert. Summarize preclinical evidence.',
      prompt,
      { maxTokens: 512 }
    );

    return response.content;
  }

  private async identifyEvidenceGaps(
    targetSymbol: string,
    indication: string | undefined,
    publications: Publication[]
  ): Promise<string[]> {
    if (!this.llm) {
      const gaps: string[] = [];
      if (publications.length < 10) {
        gaps.push('Limited publication base');
      }
      return gaps;
    }

    const prompt = `Based on ${publications.length} publications for ${targetSymbol}${indication ? ` in ${indication}` : ''}, identify 3-5 key evidence gaps that should be addressed. Return as a JSON array of strings.`;

    try {
      const response = await this.llm.sendMessage(
        'You are a target biology expert. Identify evidence gaps.',
        prompt,
        { maxTokens: 512 }
      );
      return JSON.parse(response.content);
    } catch {
      return ['Additional validation studies needed'];
    }
  }

  private async generateSafetySummary(
    targetSymbol: string,
    geneticSignals: string[],
    broadExpression: boolean,
    mechanismRisks: string[]
  ): Promise<string> {
    const signals = [...geneticSignals, ...mechanismRisks];
    if (broadExpression) {
      signals.push('Broad tissue expression');
    }
    if (signals.length === 0) {
      return `No significant safety signals identified for ${targetSymbol} based on genetic and expression data.`;
    }
    return `Safety considerations for ${targetSymbol}: ${signals.join('; ')}.`;
  }

  private async generateExecutiveSummary(
    targetSymbol: string,
    indication: string | null,
    genetic: GeneticEvidence | null,
    druggability: DruggabilityAssessment | null,
    literature: LiteratureSynthesis | null,
    safety: SafetyAssessment | null
  ): Promise<string> {
    if (!this.llm) {
      return `Target Assessment for ${targetSymbol}${indication ? ` in ${indication}` : ''}: Genetic validation is ${genetic?.validationStrength ?? 'unknown'}. ${druggability?.druggabilitySummary ?? ''} ${safety?.safetySummary ?? ''}`;
    }

    const prompt = `Generate a 2-3 paragraph executive summary for ${targetSymbol} as a therapeutic target${indication ? ` for ${indication}` : ''}.

Genetic validation: ${genetic?.summary ?? 'Not assessed'}
Druggability: ${druggability?.druggabilitySummary ?? 'Not assessed'}
Literature: ${literature?.mechanisticSummary ?? 'Not assessed'}
Safety: ${safety?.safetySummary ?? 'Not assessed'}

Structure as: (1) Overall assessment and recommendation, (2) Key strengths and supporting evidence, (3) Key risks and gaps to address.`;

    const response = await this.llm.sendMessage(
      'You are a target biology expert. Generate executive summaries for biotech due diligence.',
      prompt,
      { maxTokens: 1024 }
    );

    return response.content;
  }

  /**
   * Format report for Scientist persona (detailed, mechanistic).
   */
  formatScientistOutput(report: TargetAssessmentReport): string {
    return `# Target Assessment: ${report.targetSymbol}

**Indication Context:** ${report.indication ?? 'General'}
**Assessment Date:** ${report.assessmentDate}

## Executive Summary

${report.executiveSummary}

---

## 1. Human Genetic Validation

### Overall Assessment: ${report.geneticEvidence?.validationStrength ?? 'Not assessed'}

${report.geneticEvidence?.summary ?? 'No genetic evidence available.'}

### Genetic Constraint

| Metric | Value | Interpretation |
|--------|-------|----------------|
| pLI | ${report.geneticEvidence?.constraint?.pli?.toFixed(3) ?? 'N/A'} | ${report.geneticEvidence?.constraint?.interpretation ?? ''} |
| LOEUF | ${report.geneticEvidence?.constraint?.loeuf?.toFixed(3) ?? 'N/A'} | |
| LoF variants observed | ${report.geneticEvidence?.constraint?.lofVariantsObserved ?? 'N/A'} | |
| Homozygous LoF carriers | ${report.geneticEvidence?.constraint?.lofHomozygotes ?? 'N/A'} | |

---

## 2. Druggability Assessment

${report.druggability?.druggabilitySummary ?? 'Not assessed.'}

### Target Classification

- **Protein Class:** ${report.druggability?.proteinClass ?? 'Unknown'}
- **Subcellular Location:** ${report.druggability?.subcellularLocation.join(', ') || 'Unknown'}
- **Tractability Bucket:** ${report.druggability?.tractabilityBucket ?? 'Unknown'}

### Existing Chemical Matter

${report.druggability?.existingCompounds.length ? report.druggability.existingCompounds.map(c => `- ${c.compoundName ?? c.chemblId} (Phase ${c.maxPhase}): ${c.mechanism ?? 'Unknown mechanism'}`).join('\n') : 'No existing compounds identified.'}

### Recommended Modalities

${report.druggability?.recommendedModalities.map(m => `- ${m}`).join('\n') || 'None specified'}

---

## 3. Mechanistic Rationale

${report.literature?.mechanisticSummary ?? 'No mechanistic summary available.'}

### Preclinical Evidence

${report.literature?.preclinicalEvidence ?? 'Limited preclinical data available.'}

### Key Publications

${report.literature?.keyPublications.slice(0, 5).map((p, i) => `${i + 1}. **${p.title}** (${p.journal}, ${p.year}) - PMID: ${p.pmid}`).join('\n') || 'No publications analyzed.'}

---

## 4. Safety Considerations

${report.safety?.safetySummary ?? 'No safety assessment available.'}

---

## 5. Summary and Recommendations

### Overall Recommendation

${report.overallRecommendation}

### Key Risks

${report.keyRisks.map(r => `- ${r}`).join('\n') || 'None identified'}

### Recommended Next Steps

${report.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'None specified'}
`;
  }

  /**
   * Format report for BD persona (strategic, diligence-focused).
   */
  formatBDOutput(report: TargetAssessmentReport): string {
    const ratingToStars = (strength: EvidenceStrength | undefined): string => {
      switch (strength) {
        case 'strong': return '⭐⭐⭐⭐⭐';
        case 'moderate': return '⭐⭐⭐⭐';
        case 'limited': return '⭐⭐';
        case 'insufficient': return '⭐';
        default: return '—';
      }
    };

    return `# Target Validation Summary: ${report.targetSymbol}

**Indication:** ${report.indication ?? 'General'}
**Prepared for:** Business Development Diligence

## Quick Assessment

| Dimension | Rating | Key Finding |
|-----------|--------|-------------|
| Genetic Validation | ${ratingToStars(report.geneticEvidence?.validationStrength)} | ${report.geneticEvidence?.validationStrength ?? 'Not assessed'} |
| Druggability | ${report.druggability?.existingCompounds.length ? '⭐⭐⭐⭐' : '⭐⭐'} | ${report.druggability?.tractabilityBucket ?? 'Unknown'} |
| Clinical Precedent | ${report.druggability?.existingCompounds.some(c => c.maxPhase >= 2) ? '⭐⭐⭐⭐' : '⭐⭐'} | ${report.druggability?.existingCompounds.filter(c => c.maxPhase >= 2).length || 0} clinical-stage programs |
| Safety Profile | ${report.safety?.geneticSafetySignals.length === 0 ? '⭐⭐⭐⭐' : '⭐⭐⭐'} | ${report.safety?.geneticSafetySignals.length || 0} signals identified |

## Diligence Positioning

${report.executiveSummary}

## Key Risks for Partnership Discussions

${report.keyRisks.map(r => `- ${r}`).join('\n') || 'No significant risks identified'}

## Recommended Due Diligence Focus Areas

${report.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'Standard diligence recommended'}
`;
  }
}

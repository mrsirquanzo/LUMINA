# Patent Parsing Feature - Usage Guide

## 📋 Overview

The patent parsing system extracts structured data from patent documents (PDF, XML, HTML, DOCX, TXT) including:
- Claims with dependency trees
- Molecular structures (Markush, SMILES, compounds)
- Sequences (antibodies, nucleic acids)
- Biological data (in vitro, in vivo, clinical)
- Quality assessments and validation flags

## ✅ Dependencies Status

**Already Installed:**
- ✅ `pdf-parse` (v2.4.5) - Enhanced PDF text extraction
- ✅ `multer` (v2.0.2) - File upload handling
- ✅ `@types/multer` - TypeScript types

**PDF Parser Enhancement:**
The system now uses `pdf-parse` library for better text extraction when available, with fallback to basic parsing.

## 🎨 UI Integration Options

### Option 1: Right Panel (SonnySidePanel) - Recommended

The `PatentParsingPanel` component is designed to be integrated into the right panel alongside Sonny.

**Integration Steps:**

1. **Add Tab System to SonnySidePanel** (if not already present)
2. **Import PatentParsingPanel**
3. **Add Tab/View Toggle**

### Option 2: Standalone Modal/Page

Can be used as a standalone component in any page.

### Option 3: Integrated into Patent Expert Agent

Add as a tab within the Patent Expert Agent interface.

## 🚀 How to Use

### Via API Endpoint

```typescript
// Upload and parse a patent document
const formData = new FormData();
formData.append('file', fileBlob);
formData.append('extract_structures', 'true');
formData.append('extract_sequences', 'true');
formData.append('extract_biological_data', 'true');
formData.append('resolve_cross_references', 'true');
formData.append('validate_data', 'true');

const response = await fetch('/api/patent-parsing/parse', {
  method: 'POST',
  body: formData,
  credentials: 'include', // Required for authentication
});

const data = await response.json();
// data.extraction - PatentExtractionResult
// data.quality - QualityAssessment
```

### Via UI Component

1. **Import the component:**
```typescript
import PatentParsingPanel from './components/PatentParsingPanel';
```

2. **Use in your layout:**
```tsx
<PatentParsingPanel 
  onParsed={(result) => {
    // Handle parsed result
    console.log('Parsed patent:', result);
  }}
/>
```

## 📊 Response Structure

### PatentExtractionResult

```typescript
{
  document_info: {
    patent_number?: string;
    application_number?: string;
    publication_date?: string;
    priority_date?: string;
    assignee?: string;
    inventors?: string[];
    title?: string;
    extraction_confidence: number;
  },
  claims_analysis: {
    total_claims: number;
    independent_claims: number;
    claims: Claim[];
    dependency_tree: Map<number, number[]>;
  },
  molecular_data: {
    modality: 'small_molecule' | 'monoclonal_antibody' | ...;
    target?: string;
    sequences: {
      antibodies: AntibodySequence[];
      small_molecules: SmallMolecule[];
      nucleic_acids: NucleicAcidSequence[];
    };
    markush_structures?: MarkushStructure[];
  },
  biological_data: {
    in_vitro: BiologicalDataPoint[];
    in_vivo: BiologicalDataPoint[];
    clinical: BiologicalDataPoint[];
  },
  fto_relevant_data?: {
    genus_scope: 'broad' | 'moderate' | 'narrow';
    key_limitations_for_fto: string[];
  },
  validation_flags: ValidationFlag[];
  overall_confidence: number;
}
```

## 🔧 Integration Example: SonnySidePanel with Tabs

```tsx
// In SonnySidePanel.tsx
import { useState } from 'react';
import PatentParsingPanel from './PatentParsingPanel';
import MultiAgentCollaboration from './agents/MultiAgentCollaboration';

type PanelView = 'sonny' | 'patent-parser';

export default function SonnySidePanel({ ... }) {
  const [currentView, setCurrentView] = useState<PanelView>('sonny');

  return (
    <div className="...">
      {/* Tab Selector */}
      <div className="flex border-b">
        <button
          onClick={() => setCurrentView('sonny')}
          className={currentView === 'sonny' ? 'active' : ''}
        >
          Sonny
        </button>
        <button
          onClick={() => setCurrentView('patent-parser')}
          className={currentView === 'patent-parser' ? 'active' : ''}
        >
          Patent Parser
        </button>
      </div>

      {/* Content */}
      {currentView === 'sonny' && (
        <MultiAgentCollaboration ... />
      )}
      {currentView === 'patent-parser' && (
        <PatentParsingPanel
          onParsed={(result) => {
            // Optionally send parsed data to Sonny
            // or use in other parts of the app
          }}
        />
      )}
    </div>
  );
}
```

## 🎯 Use Cases

### 1. FTO Analysis
- Upload competitor patent
- Extract structures/sequences
- Compare with your product
- Identify blocking claims

### 2. Patent Portfolio Review
- Upload multiple patents
- Extract key claims and structures
- Build portfolio database
- Identify gaps and opportunities

### 3. Competitive Intelligence
- Parse competitor patents
- Extract biological data
- Compare efficacy profiles
- Track development timelines

### 4. Due Diligence
- Parse target company patents
- Extract all claims and structures
- Assess portfolio strength
- Identify risks and opportunities

## 🔍 Quality Indicators

The system provides quality assessments:

- **High Confidence (≥0.8):** Data is reliable, minimal manual review needed
- **Medium Confidence (0.6-0.8):** Some uncertainty, review recommended
- **Low Confidence (<0.6):** Significant issues, manual review required

**Validation Status:**
- `validated` - All checks passed
- `review_required` - Warnings present, review recommended
- `errors_detected` - Critical issues found

## ⚠️ Limitations

1. **OCR Support:** Basic OCR mentioned but not fully implemented (requires Tesseract)
2. **Image Extraction:** Chemical structures in figures not automatically extracted (Phase 2 feature)
3. **Prosecution History:** Not yet integrated (Phase 2 feature)
4. **Patent Family:** Not yet correlated (Phase 2 feature)

## 🚀 Next Steps

1. **Test the API endpoint** with a sample patent PDF
2. **Integrate UI component** into SonnySidePanel or desired location
3. **Test end-to-end flow** from upload to result display
4. **Enhance with Phase 2 features** as needed

## 📝 Example Workflow

1. User uploads patent PDF via UI
2. System extracts text using `pdf-parse`
3. Claims, structures, sequences extracted
4. Data validated and quality assessed
5. Results displayed in UI
6. User can download JSON or use data in analysis
7. Parsed data can be sent to Patent Agent for FTO analysis

# Software Requirements Specification (SRS)

## 1. Purpose

GhatWatch AI helps municipal/environmental planning users review
historical water-quality observations for Bhopal immersion locations,
inspect evidence on a map, distinguish environmental concerns from legal
status, and generate concise bilingual briefs.

## 2. Scope

**In scope:** CSV import and validation; parameter/reference
comparisons; deterministic environmental ranking; Google Maps markers
using verified coordinates; evidence/source-page traceability;
data-quality indicators; separate legal-status references; verified
nearby context; clearly labelled hypothetical scenarios; English/Hindi
brief generation from validated results.

**Out of scope for the hackathon MVP:** live government/lab integration;
automatic legal determinations or closure orders; real-time safety
certification; unvalidated fish-death predictions; guaranteed five- or
ten-year forecasts.

## 3. Users

-   Primary: municipal or environmental planning officer.
-   Secondary: environmental analyst, researcher, festival-management
    team and evaluator.

## 4. Functional requirements

  ------------------------------------------------------------------------
  ID                      Requirement              Priority
  ----------------------- ------------------------ -----------------------
  FR-01                   Load supplied historical Must
                          CSV data.                

  FR-02                   Validate schema, dates,  Must
                          numeric fields and       
                          invalid measurements.    

  FR-03                   Preserve missing, BDL    Must
                          and ND without           
                          converting them to zero. 

  FR-04                   Compare eligible         Must
                          observations against     
                          configured reference     
                          criteria.                

  FR-05                   Calculate valid sample   Must
                          counts, exceedance       
                          counts/rates and         
                          severity.                

  FR-06                   Produce a transparent    Must
                          environmental-priority   
                          ranking.                 

  FR-07                   Trace findings to source Must
                          rows, dates/years and    
                          source pages where       
                          available.               

  FR-08                   Show verified locations  Must
                          on Google Maps and open  
                          a detail panel on        
                          selection.               

  FR-09                   Display legal status     Must
                          separately from          
                          environmental priority.  

  FR-10                   Mark unverified legal    Must
                          status explicitly.       

  FR-11                   Generate English/Hindi   Should
                          briefs from validated    
                          results.                 

  FR-12                   Show nearby verified     Should
                          monitoring/context       
                          points and distances.    

  FR-13                   Show scenarios with      Should
                          explicit assumptions and 
                          limitations.             

  FR-14                   Export a summary report. Could
  ------------------------------------------------------------------------

## 5. Non-functional requirements

-   Traceability: material findings link to source data or official
    sources.
-   Transparency: criteria, sample counts, ranking method and scenario
    assumptions are visible.
-   Reliability: missing/invalid data cannot silently become a pass.
-   Security: no API keys or credentials in the public repository.
-   Performance: supplied data is analysed quickly enough for a live
    demo.
-   Usability/accessibility: readable labels, keyboard-accessible
    controls and adequate contrast.
-   Maintainability: frontend, analytics, API, legal records, ML and
    narrative generation are separate.
-   Language: English and Hindi output.

## 6. Initial environmental reference criteria

Initial outdoor-bathing reference values include pH 6.5--8.5, DO \>5
mg/L and BOD \<3 mg/L. Confirm exact operators and units against the
chosen source and configured criteria. These are comparison benchmarks,
not a universal legal permission test for idol immersion. Other
parameters must only be compared where the criterion, units and
measurement basis are verified.

## 7. Legal-status rules

Allowed values: `authorised`, `prohibited`, `conditional`,
`not_verified`. Store authority, source URL, applicable clause/scope,
document/effective dates where known and verification date. A historical
water-quality result is not proof of permission or prohibition. Use
`not_verified` unless a current applicable authoritative source supports
the status.

## 8. Acceptance criteria

-   Supplied data loads and invalid rows are handled visibly.
-   Missing, BDL and ND remain distinct.
-   Ranking is reproducible from deterministic calculations.
-   Map selection opens the matching location findings.
-   Environmental priority and legal status remain separate.
-   Coordinates are verified or explicitly marked approximate.
-   Reports include period and uncertainty caveats.
-   Historical data is not presented as live safety status.
-   No secrets are committed.

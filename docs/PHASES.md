# Development Phases and Timeline

## Delivery strategy

Build one end-to-end workflow first: dataset → validation →
deterministic analysis → map/evidence panel → legal-status reference →
optional scenario → bilingual brief.

## Four-hour plan

  -----------------------------------------------------------------------------------
  Phase                              Time Work                 Exit condition
  ----------------- --------------------- -------------------- ----------------------
  1\. Align and                 0--20 min Confirm scope,       Team agrees on
  inspect                                 inspect CSV columns, schemas, endpoints and
                                          freeze API/data      files.
                                          contracts and        
                                          ownership.           

  2\. Core data                20--65 min Load/validate data,  Backend returns
  pipeline                                preserve             analysis JSON for a
                                          missing/BDL/ND,      location.
                                          implement            
                                          comparisons and      
                                          counts.              

  3\. Parallel                65--125 min Map, dashboard,      Modules work against
  build                                   legal-source         the contract.
                                          records, ML          
                                          baseline/scenarios   
                                          and API endpoints.   

  4\. First                  125--160 min Connect map, actual  One complete
  integration                             API data, detail     location-to-evidence
                                          panel and legal      flow works.
                                          references.          

  5\. QA/evidence            160--195 min Test edge cases,     No critical data/logic
  audit                                   source traceability, errors remain.
                                          data coverage, legal 
                                          wording and          
                                          failures.            

  6\.                        195--225 min Polish labels, add   Demo works from a
  Demo/submission                         bilingual brief if   clean start.
                                          stable, prepare      
                                          README and demo.     

  7\. Final safety           225--240 min Check public repo,   Submission is
  check                                   keys, licence, run   reproducible and
                                          commands and links.  contains no secrets.
  -----------------------------------------------------------------------------------

## Milestones

1.  **Contract frozen:** CSV schema, API shape, legal status values,
    ranking inputs and caveats agreed.
2.  **Backend works:** loader, validation, comparisons and counts
    tested.
3.  **Map works:** verified coordinates, marker selection and detail
    view connected to real data.
4.  **End-to-end flow:** environmental and legal statuses separate;
    evidence and uncertainty visible.
5.  **Submission ready:** README, source list, licence, secret check and
    demo rehearsal complete.

## Cut scope in this order if late

1.  Preserve data correctness and traceability.
2.  Preserve map markers and location details.
3.  Preserve legal status as verified/unverified.
4.  Cut advanced scenarios before cutting correctness.
5.  Cut animation, authentication, database setup and unnecessary
    layers.
6.  Never fake data, coordinates, legal status or model results.

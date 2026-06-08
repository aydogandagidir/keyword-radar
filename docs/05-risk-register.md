# Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---:|---:|---|
| Marketplace DOM changes break adapters | High | High | Adapter isolation, fallback selectors, QA checklist |
| Autocomplete extraction unstable | Medium | High | Graceful failure, empty result handling, manual tests |
| Search volume data unavailable | High | Medium | Do not promise exact volume in MVP |
| Chrome Web Store permission rejection | Medium | High | Minimal permissions, clear privacy docs |
| User expects guaranteed data | Medium | Medium | Explain limitations in UI and docs |
| Aggressive request behavior causes blocking | Medium | High | User-triggered collection, throttling |
| Legal/compliance concerns | Medium | High | No private data collection, no credentials |
| Scope creep | High | Medium | Lock MVP to P0/P1 features |
| AI cost growth | Low in MVP | Medium | AI disabled by default |
| Competitor reaction | Medium | Medium | Focus Turkish marketplace niche |

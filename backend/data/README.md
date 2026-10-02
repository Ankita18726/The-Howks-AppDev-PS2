# Legal knowledge integration contract

The real, verified legal knowledge base is intentionally not included yet.

Add one file per supported category here:

- `consumer.json`
- `cyber_fraud.json`
- `rental.json`
- `salary.json`
- `government_grievance.json`

The service loads these automatically. A category file may contain a `problems` object keyed by the AI service's `problemType` (or put those keys at the top level). Each entry must have this shape:

```json
{
  "summary": "Verified summary",
  "rights": ["Verified item"],
  "nextSteps": ["Verified step"],
  "documents": ["Verified document"],
  "authority": { "name": "", "description": "", "url": "" },
  "source": { "label": "", "reference": "", "status": "verified" }
}
```

Do not copy the development placeholder into production data. Person 1 should validate both the content and source metadata before setting `status` to `verified`.

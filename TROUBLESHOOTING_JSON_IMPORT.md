# Troubleshooting: Invalid JSON File Format

## Why did I get "Invalid JSON file format"?

The error usually occurs because **standard JSON (RFC 8259) is very strict**:
1.  **No Comments**: You cannot use `//` or `/* */` comments.
2.  **No Trailing Commas**: `{"a": 1,}` is invalid. The last item must not have a comma.
3.  **Quoted Keys**: `{title: "Event"}` is invalid. You must use `{"title": "Event"}`.

If you copied a code snippet that contained `//` comments, the parser will fail.

## Steps Taken to Fix

1.  **Improved Error Messages**: We updated `src/features/events/services/eventService.ts` to show the specific syntax error details (e.g., "Unexpected token /...") instead of the generic message.
2.  **Created Sample File**: A valid, clean JSON file has been created at `sample-event.json` in the project root.

## Valid JSON Example

Use this format (no comments!):

```json
{
  "title": "Tech Summit 2026",
  "category": "tech",
  "startDate": "2026-03-15T09:00:00.000Z",
  "locationType": "physical",
  "ticketTiers": [],
  "isPrivate": false
}
```

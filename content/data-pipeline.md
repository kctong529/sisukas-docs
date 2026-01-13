---
weight: 4
title: "Data Pipeline"
---

# Course Data Pipeline

> [!NOTE]
> The course data (`courses.json`) was retrieved using the Aalto Open API, following the instructions at [3scale Aalto Open API Docs](https://3scale.apps.ocp4.aalto.fi/docs/swagger/open_courses_sisu). The data was obtained using the `GET /courseunitrealisations` endpoint, with the parameter: `startTimeAfter=2024-01-01`.

> [!IMPORTANT]
> The app uses a cached version of this data with HTTP conditional requests (If-Modified-Since) to ensure fast performance while staying up-to-date. The browser will automatically fetch updates only when the data has changed on the server.

## Overview

Sisukas maintains an up-to-date course database by automatically fetching course data from the Aalto University API, transforming it for efficient delivery, and detecting changes.

The process runs:
- **Daily** at 6 AM UTC (automatic)
- **On demand** via GitHub Actions workflow dispatch
- **On push** to main or dev branches

## Data Flow

```
Aalto API
   ↓
Fetch Latest Courses (fetch_latest_courses.py)
   ↓
Transform (transform_courses.py)
   ↓
Compare with Previous (report_course_changes.py)
   ↓
Report Changes
   ↓
Upload to GCS (if changes detected)
   ↓
Frontend Loads courses.json
```

## Components

### 1. Data Fetch

**File:** `scripts/fetch_latest_courses.py`

Fetches course data from Aalto's SISU API:

```
GET https://course.api.aalto.fi/api/sisu/v1/courseunitrealisations
```

**Parameters:**
- `USER_KEY` — API authentication (from `AALTO_USER_KEY` secret)
- `startTimeAfter` — Only courses after 2024-01-01

**Output:** `latest_fetch.json` (raw API response)

**Requirements:**
- `AALTO_USER_KEY` environment variable must be set
- Requires internet connectivity to Aalto API

### 2. Data Transform

**File:** `scripts/transform_courses.py`

Reduces raw API data to include only necessary fields. This significantly reduces file size while retaining all information needed for filtering and display.

**Input:** Raw API JSON from fetch

**Included Fields:**
```
id, code, startDate, endDate, type, name
summary (prerequisites, level)
organizationName, credits, courseUnitId
languageOfInstructionCodes, teachers
enrolmentStartDate, enrolmentEndDate
```

**Excluded Fields:**
- Detailed descriptions
- Complex nested metadata
- API-specific administrative fields
- Historical versions

**Size Reduction:**
- Original API response: ~40-50 MB
- Transformed output: ~10-15 MB
- Gzipped: ~2-3 MB

**Usage:**
```bash
python scripts/transform_courses.py latest_fetch.json latest.json
```

### 3. Change Detection

**File:** `scripts/report_course_changes.py`

Compares transformed courses with the previous `courses.json` to detect:
- **Added** courses (new IDs)
- **Removed** courses (IDs no longer in API)
- **Updated** courses (same ID, changed fields)

**Important Fields Compared:**
- Course code
- Course name (English)
- Credits
- Start/end dates
- Enrollment dates

**Output:**
- Console summary (added/removed/updated counts)
- Detailed JSON log in `logs/course_changes_*.json`
- GitHub Actions output variables for workflow control

**Example Summary:**
```
COURSE UPDATE SUMMARY
==================================================
Added: 12 | Removed: 3 | Updated: 45

ADDED COURSES (12):
  + CS-E4160 – Machine Learning
       Credits: 5
       Start: 2024-09-01 | End: 2024-12-31

REMOVED COURSES (3):
  - CS-E1234 – Old Course Name
  
UPDATED COURSES (45):
  ? CS-E4000 – Advanced Algorithms
      * Credits:
          (old) 5
          (new) 6
```

## GitHub Actions Workflow

**File:** `.github/workflows/check_course_updates.yml`

### Triggers

```yaml
on:
  workflow_dispatch:        # Manual trigger
  schedule:
    - cron: '0 6 * * *'    # Daily at 6 AM UTC
  push:
    branches:
      - main
      - dev
```

### Workflow Steps

**1. Prepare Data Job**

- Checkout repository
- Determine GCS bucket (main → sisukas-core, dev → sisukas-core-test)
- Fetch existing courses.json from GCS
- Fetch latest courses from API
- Transform latest courses
- Check for changes
- Prepare artifacts (if changes detected)

**2. Upload to GCS Job**

Runs only if changes are detected.

- Downloads prepared artifacts
- Uploads courses.json.gz to GCS (renamed to courses.json)
- Uploads courses.hash.json (no caching)
- Uploads change logs

### Environment Variables

```yaml
PYTHON_VERSION: '3.12'
AALTO_USER_KEY: ${{ secrets.AALTO_USER_KEY }}  # Secret
```

### Bucket Strategy

**Production (main branch):**
- Bucket: `sisukas-core`
- Used by live app at sisukas.eu
- Only updates on changes

**Development (dev branch):**
- Bucket: `sisukas-core-test`
- Used for testing new data schemas
- Separate from production

### GCS File Structure

```
gs://sisukas-core/
├── courses.json              # Current course data (gzipped)
├── courses.hash.json         # Hash/metadata (no caching)
└── logs/
    ├── course_changes_20240115_060000.json
    ├── course_changes_20240116_060000.json
    └── ...
```

**Cache Strategy:**
- `courses.json` — Cached by browser and CDN (aggressive caching)
- `courses.hash.json` — No cache (always fresh, used to check if data changed)
- `logs/` — Long-term storage of all changes

## Data Update Frequency

**Automatic Updates:**
- Daily at 6 AM UTC
- Only if changes are detected
- No update = no new deployment

**Manual Updates:**
- Trigger via GitHub Actions "workflow_dispatch"
- Useful for immediate updates if API changes
- Can force update even without changes

**On Code Push:**
- Updates when pushing to main or dev
- Ensures data is fresh after code deployments

## Local Development

### Testing Data Fetch

```bash
export AALTO_USER_KEY="your_api_key"
python scripts/fetch_latest_courses.py
```

This creates `latest_fetch.json` with raw API data.

### Testing Data Transform

```bash
python scripts/transform_courses.py latest_fetch.json latest.json
```

This creates `latest.json` with transformed data.

### Testing Change Detection

```bash
cp latest.json courses.json  # Make a "previous" version
# Modify courses.json slightly
python scripts/report_course_changes.py
```

This compares and reports changes.

### Using Local Data

To use local courses.json in development:

```bash
cd frontend/course-browser
npm run dev
```

The dev server loads `courses.json` from the project root. You can replace it with local data for testing.

## Data Quality

### What Gets Stored

- Course metadata from Aalto API
- Teacher information
- Schedule and enrollment dates
- Credits and prerequisites
- Language of instruction

### What Gets Filtered Out

- Complex nested structures
- Redundant administrative fields
- Historical course versions
- API-specific metadata

### Validation

The transformation includes basic validation:
- All required fields present
- Date formats consistent
- IDs are unique
- No null values in critical fields

## Monitoring & Maintenance

### Check Workflow Status

1. Go to GitHub Actions
2. Select "Check Course Updates" workflow
3. View latest run:
   - Green ✓ = Success (data updated or no changes)
   - Red ✗ = Failure (API error, auth issue, etc.)

### View Change Logs

Change logs are stored in GCS and archived locally:
- In repository: `logs/course_changes_*.json`
- In GCS: `gs://sisukas-core/logs/`

### Troubleshooting

**"AALTO_USER_KEY not set"**

The GitHub secret is not configured. Contact the project maintainer to add the API key.

**"No existing courses.json"**

First run of the workflow. This is expected. The workflow creates the initial courses.json.

**"GCS upload failed"**

Check:
- Google Cloud authentication is configured
- Service account has write permissions
- GCS bucket exists and is accessible

**API returns no data**

Check:
- Aalto API is accessible
- API key is valid and hasn't expired
- Network connectivity to Aalto servers

## Architecture Notes

### Why Fetch → Transform → Upload?

1. **Decouple API from frontend** — Frontend doesn't depend on API format
2. **Reduce file size** — Transformed data is ~75% smaller
3. **Enable change tracking** — Compare versions to understand what changed
4. **Optimize browser caching** — Smaller files = faster downloads

### Why GCS?

- **Global distribution** — Files served from nearest region
- **Automatic caching** — CDN integration for fast delivery
- **Cost-effective** — Cheap storage, no server overhead
- **Reliable** — Google's infrastructure
- **Separate data from code** — Data doesn't bloat git history

### Why Hash File?

- **Cache busting** — Hash file is never cached
- **Change detection** — Frontend can check if data changed without downloading full file
- **Efficient updates** — Only download new data if something changed

## Extending the Pipeline

### Adding a New Data Source

1. Create new fetch script: `scripts/fetch_*.py`
2. Add transformation logic if needed
3. Update workflow to include new step
4. Test with manual workflow dispatch

### Modifying Transformation

1. Edit `scripts/transform_courses.py`
2. Test locally with `python scripts/transform_courses.py input.json output.json`
3. Compare file sizes and verify no data loss
4. Commit and push to dev branch for testing

### Adding New Fields

1. Add field to `transform_course()` function
2. Update `get_important_fields()` in report script if field is comparable
3. Test the transformation
4. Monitor change logs to see impact

## References

- [Aalto API Documentation](https://course.api.aalto.fi/)
- [Google Cloud Storage](https://cloud.google.com/storage)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
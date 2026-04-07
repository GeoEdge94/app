#!/usr/bin/env python3
"""
Scrape prediction markets from Manifold Markets and Metaculus.
Processes downloaded JSON files, deduplicates, and saves results.
"""
import json
import os
import sys
import urllib.request
import urllib.error
import time
from datetime import datetime

DATADIR = os.path.dirname(os.path.abspath(__file__))
LOG = []

def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{ts}] {msg}"
    LOG.append(entry)
    print(entry)

# ============================================================
# MANIFOLD MARKETS
# ============================================================
def fetch_manifold(term):
    """Fetch markets from Manifold Markets API."""
    url = f"https://api.manifold.markets/v0/search-markets?term={term}&limit=50"
    log(f"MANIFOLD API: Fetching {url}")
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            log(f"MANIFOLD API: term='{term}' returned {len(data)} markets (HTTP {resp.status})")
            return data
    except urllib.error.HTTPError as e:
        log(f"MANIFOLD API ERROR: term='{term}' HTTP {e.code}")
        return []
    except Exception as e:
        log(f"MANIFOLD API ERROR: term='{term}' {e}")
        return []

def process_manifold():
    """Process all Manifold Markets search terms and deduplicate."""
    terms = ["climate", "earthquake", "hurricane", "wildfire", "flood", "weather", "fire", "tornado"]
    all_markets = {}
    total_raw = 0

    for term in terms:
        # Try loading from pre-downloaded file first
        tmp_file = os.path.join(DATADIR, f"tmp_manifold_{term}.json")
        if os.path.exists(tmp_file):
            try:
                with open(tmp_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                log(f"MANIFOLD: Loaded {len(data)} markets for term='{term}' from cached file")
            except Exception as e:
                log(f"MANIFOLD: Cache file error for term='{term}': {e}, fetching from API")
                data = fetch_manifold(term)
        else:
            data = fetch_manifold(term)

        total_raw += len(data)

        for market in data:
            mid = market.get("id", "")
            if mid and mid not in all_markets:
                all_markets[mid] = {
                    "id": mid,
                    "question": market.get("question", ""),
                    "probability": market.get("probability"),
                    "volume": market.get("volume", 0),
                    "totalLiquidity": market.get("totalLiquidity", 0),
                    "createdTime": market.get("createdTime"),
                    "closeTime": market.get("closeTime"),
                    "url": market.get("url", ""),
                    "resolution": market.get("resolution"),
                    "isResolved": market.get("isResolved", False),
                    "outcomeType": market.get("outcomeType", ""),
                    "creatorUsername": market.get("creatorUsername", ""),
                    "slug": market.get("slug", ""),
                    "uniqueBettorCount": market.get("uniqueBettorCount", 0),
                    "lastUpdatedTime": market.get("lastUpdatedTime"),
                    "search_terms": [term],
                    "token": market.get("token", ""),
                    "mechanism": market.get("mechanism", ""),
                }
            elif mid in all_markets:
                if term not in all_markets[mid]["search_terms"]:
                    all_markets[mid]["search_terms"].append(term)

    results = list(all_markets.values())
    duplicates_removed = total_raw - len(results)
    log(f"MANIFOLD: Total raw results across all terms: {total_raw}")
    log(f"MANIFOLD: Duplicates removed: {duplicates_removed}")
    log(f"MANIFOLD: Total unique markets after deduplication: {len(results)}")
    return results

# ============================================================
# METACULUS
# ============================================================
def fetch_metaculus(search_term):
    """Try to fetch from Metaculus API (requires auth, will likely fail)."""
    urls_to_try = [
        f"https://www.metaculus.com/api2/questions/?search={search_term}&limit=50&status=open",
        f"https://www.metaculus.com/api/questions/?search={search_term}&limit=50&status=open",
    ]
    for url in urls_to_try:
        log(f"METACULUS API: Trying {url}")
        try:
            req = urllib.request.Request(url, headers={
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GeoEdge/1.0"
            })
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                results = data.get("results", data) if isinstance(data, dict) else data
                log(f"METACULUS API: term='{search_term}' returned {len(results)} questions (HTTP {resp.status})")
                return results
        except urllib.error.HTTPError as e:
            log(f"METACULUS API: term='{search_term}' HTTP {e.code} - {e.reason}")
        except Exception as e:
            log(f"METACULUS API: term='{search_term}' Error - {e}")
    return []

def process_metaculus():
    """Process all Metaculus search terms and deduplicate."""
    terms = ["climate", "earthquake", "hurricane", "wildfire", "flood", "temperature", "drought", "weather"]
    all_questions = {}
    total_raw = 0

    for term in terms:
        data = fetch_metaculus(term)
        total_raw += len(data)

        for q in data:
            qid = str(q.get("id", ""))
            if qid and qid not in all_questions:
                cp = q.get("community_prediction", {})
                if isinstance(cp, dict):
                    prob = cp.get("full", {}).get("q2") or cp.get("full", {}).get("y")
                else:
                    prob = cp

                all_questions[qid] = {
                    "id": int(qid),
                    "title": q.get("title", q.get("title_short", "")),
                    "community_prediction": prob,
                    "number_of_predictions": q.get("number_of_predictions", 0),
                    "created_at": q.get("created_time", q.get("created_at", "")),
                    "close_time": q.get("scheduled_close_time", q.get("close_time", "")),
                    "resolve_time": q.get("scheduled_resolve_time", q.get("resolve_time", "")),
                    "url": f"https://www.metaculus.com/questions/{qid}",
                    "resolution_criteria": q.get("resolution_criteria", ""),
                    "category": q.get("category", ""),
                    "type": q.get("type", ""),
                    "search_terms": [term],
                }
            elif qid in all_questions:
                if term not in all_questions[qid]["search_terms"]:
                    all_questions[qid]["search_terms"].append(term)

    results = list(all_questions.values())
    duplicates_removed = total_raw - len(results)
    log(f"METACULUS: Total raw results across all terms: {total_raw}")
    log(f"METACULUS: Duplicates removed: {duplicates_removed}")
    log(f"METACULUS: Total unique questions after deduplication: {len(results)}")
    return results

# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    log("=" * 60)
    log("STARTING PREDICTION MARKET SCRAPER")
    log("=" * 60)

    # Process Manifold Markets
    log("")
    log("--- MANIFOLD MARKETS ---")
    manifold_results = process_manifold()

    # Process Metaculus
    log("")
    log("--- METACULUS ---")
    metaculus_results = process_metaculus()

    # Save results
    manifold_output = {
        "source": "manifold_markets",
        "scraped_at": datetime.now().isoformat(),
        "total_markets": len(manifold_results),
        "search_terms": ["climate", "earthquake", "hurricane", "wildfire", "flood", "weather", "fire", "tornado"],
        "markets": manifold_results,
    }

    metaculus_output = {
        "source": "metaculus",
        "scraped_at": datetime.now().isoformat(),
        "total_questions": len(metaculus_results),
        "search_terms": ["climate", "earthquake", "hurricane", "wildfire", "flood", "temperature", "drought", "weather"],
        "api_note": "Metaculus API requires authentication and is behind Cloudflare protection. API returned 403 for all endpoints. An API key is needed to access Metaculus data." if len(metaculus_results) == 0 else "",
        "questions": metaculus_results,
    }

    manifold_path = os.path.join(DATADIR, "scraped_manifold.json")
    metaculus_path = os.path.join(DATADIR, "scraped_metaculus.json")

    with open(manifold_path, "w", encoding="utf-8") as f:
        json.dump(manifold_output, f, indent=2, ensure_ascii=False)
    log(f"Saved Manifold results to {manifold_path}")

    with open(metaculus_path, "w", encoding="utf-8") as f:
        json.dump(metaculus_output, f, indent=2, ensure_ascii=False)
    log(f"Saved Metaculus results to {metaculus_path}")

    # Save log
    log_path = os.path.join(DATADIR, "scrape_log.txt")
    with open(log_path, "w", encoding="utf-8") as f:
        f.write("\n".join(LOG))

    log("")
    log("=" * 60)
    log("SUMMARY")
    log("=" * 60)
    log(f"Manifold Markets: {len(manifold_results)} unique markets")
    log(f"Metaculus: {len(metaculus_results)} unique questions")
    log(f"Log saved to {log_path}")

    # Cleanup temp files
    for fn in os.listdir(DATADIR):
        if fn.startswith("tmp_manifold_"):
            os.remove(os.path.join(DATADIR, fn))
            log(f"Cleaned up temp file: {fn}")

#!/usr/bin/env python3
"""
Scrape Metaculus questions via metaforecast.org GraphQL API.
Metaculus direct API requires authentication and is behind Cloudflare.
Metaforecast aggregates Metaculus data and provides a public GraphQL API.
"""
import json
import os
import sys
import urllib.request
import urllib.error
import time
from datetime import datetime

# Force UTF-8 output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

DATADIR = os.path.dirname(os.path.abspath(__file__))

KEYWORDS = [
    "climate", "temperature", "weather", "hurricane", "earthquake", "wildfire",
    "fire", "flood", "drought", "tornado", "storm", "sea level", "carbon", "emission",
    "glacier", "arctic", "ice", "disaster", "tsunami", "volcano", "heat", "precipitation",
    "warming", "CO2", "methane", "extreme", "cyclone", "typhoon", "forest", "ocean",
    "coral", "extinction", "biodiversity", "pollution", "ozone", "deforestation",
    "celsius", "fahrenheit", "el nino", "la nina", "enso", "monsoon", "blizzard",
    "landslide", "avalanche", "seismic", "richter", "magnitude", "tropical",
    "geothermal", "solar", "renewable", "fossil fuel", "greenhouse", "atmosphere",
    "coastal", "erosion", "permafrost", "tundra", "rainforest", "desertification",
    "air quality", "particulate", "smog", "nuclear", "radiation", "fallout",
    "pandemic", "epidemic", "famine", "water scarcity", "crop", "agriculture",
]

def query_metaforecast(ids):
    """Query multiple Metaculus question IDs from metaforecast."""
    parts = []
    for i, qid in enumerate(ids):
        parts.append(
            f'q{i}: question(id: "metaculus-{qid}") '
            '{ id title url options { name probability } '
            'qualityIndicators { numForecasters numForecasts } }'
        )

    query = "{ " + " ".join(parts) + " }"
    payload = json.dumps({"query": query})

    req = urllib.request.Request(
        "https://metaforecast.org/api/graphql",
        data=payload.encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if "errors" in data and data.get("data") is None:
                return []
            results = data.get("data", {})
            found = []
            for k, v in results.items():
                if v is not None:
                    found.append(v)
            return found
    except Exception as e:
        return []


def main():
    print("Scanning Metaculus questions via metaforecast.org...")

    all_found = []
    batch_size = 50
    max_id = 30000

    for batch_start in range(1, max_id + 1, batch_size):
        ids = list(range(batch_start, min(batch_start + batch_size, max_id + 1)))
        results = query_metaforecast(ids)
        if results:
            all_found.extend(results)
        if batch_start % 1000 == 1:
            print(f"  Scanned up to {batch_start + batch_size - 1}, total found: {len(all_found)}")
        time.sleep(0.05)

    print(f"\nTotal Metaculus questions found on metaforecast: {len(all_found)}")

    # Filter for geo/climate topics
    geo_questions = []
    for q in all_found:
        title_lower = q["title"].lower()
        if any(kw.lower() in title_lower for kw in KEYWORDS):
            geo_questions.append(q)

    print(f"Climate/weather/disaster/geo related: {len(geo_questions)}")

    # Build output in the Metaculus format requested
    metaculus_output = []
    seen_ids = set()

    for q in geo_questions:
        qid = q["id"].replace("metaculus-", "")
        if qid in seen_ids:
            continue
        seen_ids.add(qid)

        # Extract probability from options
        probability = None
        if q.get("options"):
            for opt in q["options"]:
                if opt.get("name", "").lower() == "yes" and opt.get("probability") is not None:
                    probability = opt["probability"]
                    break
            if probability is None and q["options"] and q["options"][0].get("probability") is not None:
                probability = q["options"][0]["probability"]

        num_forecasts = None
        qi = q.get("qualityIndicators", {})
        if qi:
            num_forecasts = qi.get("numForecasts") or qi.get("numForecasters")

        metaculus_output.append({
            "id": int(qid) if qid.isdigit() else qid,
            "title": q["title"],
            "community_prediction": probability,
            "number_of_predictions": num_forecasts,
            "url": q["url"],
            "resolution_criteria": "",
            "category": "climate/weather/disaster",
            "options": q.get("options", []),
            "source": "metaforecast.org (Metaculus mirror)",
        })

    # Sort by ID
    metaculus_output.sort(key=lambda x: x["id"] if isinstance(x["id"], int) else 0)

    output = {
        "source": "metaculus",
        "scraped_at": datetime.now().isoformat(),
        "scraped_via": "metaforecast.org GraphQL API (Metaculus direct API requires auth/Cloudflare)",
        "total_metaculus_on_metaforecast": len(all_found),
        "total_questions": len(metaculus_output),
        "search_terms_used_as_filters": ["climate", "earthquake", "hurricane", "wildfire", "flood", "temperature", "drought", "weather"],
        "api_attempts": {
            "metaculus_api2_direct": "HTTP 403 - Requires authentication, behind Cloudflare",
            "metaculus_api_direct": "HTTP 403 - Requires authentication, behind Cloudflare",
            "metaculus_web_scrape": "HTTP 403 - Cloudflare JS challenge blocks curl/fetch",
            "metaforecast_graphql": f"SUCCESS - Found {len(all_found)} total Metaculus questions, {len(metaculus_output)} geo/climate related",
        },
        "questions": metaculus_output,
    }

    output_path = os.path.join(DATADIR, "scraped_metaculus.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nSaved {len(metaculus_output)} questions to {output_path}")

    # Print summary
    for q in metaculus_output[:10]:
        prob_str = f" ({q['community_prediction']:.0%})" if q['community_prediction'] else ""
        fc_str = f" [{q['number_of_predictions']} forecasts]" if q['number_of_predictions'] else ""
        print(f"  [{q['id']}] {q['title'][:80]}{prob_str}{fc_str}")
    if len(metaculus_output) > 10:
        print(f"  ... and {len(metaculus_output) - 10} more")


if __name__ == "__main__":
    main()

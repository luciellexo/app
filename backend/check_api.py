import requests
import json

query = """
{
    substances(limit: 10) {
        name
        url
        roas {
            name
            dose {
                units
                threshold
                light
                common
                strong
                heavy
            }
            duration {
                onset { min max units }
                comeup { min max units }
                peak { min max units }
                offset { min max units }
                total { min max units }
                afterglow { min max units }
            }
            bioavailability { min max }
        }
        interactions {
            name
            status
            note
        }
        # uncertain if 'halfLife' is a direct field, checking common fields
    }
}
"""

try:
    response = requests.post('https://api.psychonautwiki.org/', json={'query': query})
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Exception: {e}")

import requests
import json

query = """
{
    substances(limit: 5) {
        name
        url
        roas {
            name
            dose {
                units
                threshold
                light { min max units }
                common { min max units }
                strong { min max units }
                heavy
            }
            duration {
                onset { min max units }
                comeup { min max units }
                peak { min max units }
                offset { min max units }
                total { min max units }
            }
        }
        # Checking interaction fields
        dangerousInteractions {
            name
        }
        unsafeInteractions {
            name
        }
        uncertainInteractions {
            name
        }
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

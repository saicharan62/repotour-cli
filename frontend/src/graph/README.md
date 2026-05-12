Graph rendering lives here as the frontend grows beyond lane/card views.

The contract is `RepoProfile.architectureGraph`; components should not read
from the filesystem or call analyzers directly.

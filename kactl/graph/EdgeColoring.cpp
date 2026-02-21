vi edgeColoring(int N, vector<pii> eds) {
    vi cc(N + 1), ret(sz(eds)), fan(N), free(N), loc;

    for (pii e : eds) ++cc[e.first], ++cc[e.second];
    int u, v, ncols = *max_element(all(cc)) + 1;
    vector<vi> adj(N);
    vi adjn(N); vi ncols_vi(ncols, -1);
    for (pii e : eds) {
        tie(u, v) = e;
        adj[u].push_back(v); adj[v].push_back(u);
    }

    return ret;
}

vi eulerWalk(vector<vector<pii>>& gr, int nedges, int src=0) {
    int n = sz(gr);
    vi D(n), its(n), eu(nedges), ret, s = {src};
    D[src]++;
    while (!s.empty()) {
        int x = s.back(), y, e, sit = its[x], end = sz(gr[x]);
        if (sit == end) { ret.push_back(x); s.pop_back(); continue; }
        tie(y, e) = gr[x][sit]; its[x] = sit + 1;
        if (!eu[e]) {
            D[x]--, D[y]++;
            eu[e] = 1; s.push_back(y);
        }
    }
    for (int x : D) if (x < 0 || sz(ret) != nedges+1) return {};
    return {ret.rbegin(), ret.rend()};
}

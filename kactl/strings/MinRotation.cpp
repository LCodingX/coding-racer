int minRotation(string s) {
    int a=0, N=sz(s); s += s;
    rep(b,0,N) for (int k=0; k<N; k++) {
        if (s[a+k] < s[b+k] || a+k == b) break;
        if (s[a+k] > s[b+k]) { a = max(a+k+1, b); break; }
    }
    return a;
}

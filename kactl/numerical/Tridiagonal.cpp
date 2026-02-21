typedef double T;
vector<T> tridiagonal(vector<T> diag, const vector<T>& super,
        const vector<T>& sub, vector<T> b) {
    int n = sz(b); vi tr(n);
    rep(i,0,n-1) {
        if (abs(diag[i]) < 1e-9 * abs(super[i])) {
            b[i+1] -= b[i] * diag[i+1] / super[i];
            if (i+2 < n) b[i+2] -= b[i] * sub[i+1] / super[i];
            diag[i+1] = sub[i]; tr[++i] = 1;
        } else {
            diag[i+1] -= super[i]*sub[i]/diag[i];
            b[i+1] -= b[i]*sub[i]/diag[i];
        }
    }

    for (int i = n; i--;) {
        if (tr[i]) {
            swap(b[i], b[i-1]);
            diag[i-1] = diag[i];
            b[i] /= super[i];
            if (i) b[i-1] -= b[i]*super[i-1];
        } else {
            b[i] /= diag[i];
            if (i) b[i-1] -= b[i]*sub[i]/diag[i];
        }
    }
    return b;
}

struct SuffixTree {
    enum { N = 200010, ALPHA = 26 };
    int toi(char c) { return c - 'a'; }
    string a;
    int t[N][ALPHA],l[N],r[N],p[N],s[N],v=0,q=0,m=2;

    void ukkadd(int i, int c) {

        if (t[v][c]==-1) { t[v][c]=m; l[m]=i; p[m++]=v; }
        else if (r[v]<=q) { v=t[v][c]; q=l[v]; }
        else if (a[q]==c) { q++; return; }
        else {

            l[m]=l[v]; r[m]=q; p[m]=p[v]; t[m][toi(a[q])]=v;
            t[p[v]][toi(a[l[v]])]=m; l[v]=q; p[v]=m++;

            l[m]=i; p[m]=m-1; t[m-1][c]=m++;
            v=s[p[m-2]]; q=l[m-2];
            while (q<r[m-2]) { v=t[v][toi(a[q])]; q+=r[v]-l[v]; }
            if (q==r[m-2]) s[m-2]=v;
            v=s[m-2]; q=r[v];
        }
    }

    SuffixTree(string a) : a(a) {
        fill(t[0], t[N], -1);
        fill(l, l+N, 0); fill(r, r+N, 0);
        s[0] = -1; l[0] = -1; r[0] = 0; p[0] = 0;
        s[1] = 0; l[1] = -1; r[1] = 0; p[1] = 0;
        rep(i,0,sz(a)) ukkadd(i, toi(a[i]));
    }
};

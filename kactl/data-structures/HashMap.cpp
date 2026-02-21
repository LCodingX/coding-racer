#include <bits/extc++.h>

struct chash {
    const uint64_t C = ll(1e18) + 9;
    ll operator()(ll x) const { return __builtin_bswap64(x*C); }
};
__gnu_pbds::gp_hash_table<ll,int,chash> h({},{},{},{},{1<<16});

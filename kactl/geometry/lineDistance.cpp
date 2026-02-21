template<class P>
double lineDist(P& a, P& b, P& p) {
    return (double)(b-a).cross(p-a)/(b-a).dist();
}

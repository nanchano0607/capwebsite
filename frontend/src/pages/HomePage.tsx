import { Link } from "react-router-dom";


export default function HomePage() {
return (
<>
{/* Hero */}
<section className="bg-slate-50">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
<h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-slate-900 leading-tight">
Timeless<br className="hidden sm:block" /> Elegance
</h1>
<p className="mt-6 text-slate-600 max-w-2xl mx-auto">
Discover our curated collection of premium hats, crafted with exceptional attention to detail and timeless style.
</p>
<Link
to="/collections"
className="inline-flex mt-10 h-12 items-center justify-center rounded-md bg-slate-900 px-8 text-white text-sm font-medium hover:bg-slate-800"
>
Explore Collection
</Link>
</div>
</section>


{/* Featured */}
<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
<h2 className="text-2xl text-center font-semibold">Featured Collection</h2>
<p className="text-center text-slate-600 mt-2">Handpicked pieces that define sophistication</p>


<div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
{[1,2,3,4,5,6].map((i) => (
<article key={i} className="group">
<div className="aspect-[4/3] rounded-xl bg-slate-200 overflow-hidden"></div>
<div className="mt-4 flex items-center justify-between">
<div>
<h3 className="font-medium">Premium Cap #{i}</h3>
<p className="text-sm text-slate-600">₩39,000</p>
</div>
<Link
to={`/category/caps`}
className="text-sm text-slate-900 underline underline-offset-4 hover:no-underline"
>
View
</Link>
</div>
</article>
))}
</div>
</section>
</>
);
}
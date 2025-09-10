import { useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";


export default function CollectionPage() {
const { slug } = useParams();
const { user } = useAuth();


const addToCart = (id: number) => {
if (!user) {
window.location.href = "/login?redirect=/cart"; // login required
return;
}
// TODO: replace with real API call
alert(`Added product ${id} to cart!`);
};


return (
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
<h1 className="text-2xl font-semibold mb-6">{slug ? slug.toUpperCase() : "Collections"}</h1>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
{[...Array(9)].map((_, idx) => (
<div key={idx} className="rounded-xl border border-slate-200 p-4 bg-white">
<div className="aspect-[4/3] rounded-lg bg-slate-100" />
<div className="mt-4">
<div className="flex items-center justify-between">
<div>
<p className="font-medium">Item {idx + 1}</p>
<p className="text-slate-600 text-sm">₩39,000</p>
</div>
<button
onClick={() => addToCart(idx + 1)}
className="h-9 px-3 rounded-md bg-slate-900 text-white text-sm hover:bg-slate-800"
>
Add to Cart
</button>
</div>
</div>
</div>
))}
</div>
</div>
);
}
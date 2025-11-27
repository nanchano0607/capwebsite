export default function ContactPage() {
	const API = import.meta.env.DEV ? "http://localhost:8080" : "";
	const bg = `${API}/images/background.png`;

	return (
		<div className="min-h-screen relative">
			<div
				className="fixed inset-0 w-full h-full bg-cover bg-center pointer-events-none"
				style={{ backgroundImage: `url('${bg}')`, zIndex: 0 }}
			/>

			<main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 prose prose-slate font-sans font-semibold">
				{/* 중앙에 표시: 이미지 크기는 뷰포트 비율(vmin)로 설정하여 반응형 유지 */}
				<div className="flex items-center justify-center w-full">
					<a
						href="https://www.instagram.com/nanchano_/"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Open Instagram profile"
					>
						<img
							src={`${API}/images/instarIcon.png`}
							alt="instar icon"
							className="w-[25vmin] h-[25vmin] object-contain cursor-pointer"
						/>
					</a>
				</div>

				{/* 텍스트는 사진 위에 겹치지 않도록 화면의 오른쪽 아래에 절대 위치시킵니다. */}
				<div className="absolute bottom-[15%] right-[20%] text-right text-white">
                    <h1 className="text-2xl font-medium">Instargram - nanchano_</h1>
                    <p className="text-lg">Email - kimchanho111@gmail.com</p>
                </div>
			</main>
		</div>
	);
}
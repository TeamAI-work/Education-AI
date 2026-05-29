export default function Testlanding() {

    const grades = [
        { grade: 'Grade 1-4',
            color: "bg-"
        }
    ]
    return (
        <div>

            {/* Header */}
            <div className="w-full h-16 flex items-center justify-start px-10">
                <span className="text-3xl font-bold">Education AI</span>
            </div>

            {/* Hero Section */}
            <div className="flex flex-col md:flex-row items-center justify-around w-full gap-10 md:gap-10">
                <div className="h-screen md:*: flex flex-col items-center md:items-start justify-center gap-5">
                    <div className="mt-16 md:mt-0 flex justify-center items-center flex-col md:items-start md:text-left">
                        <div className="text-5xl font-bold tracking-wider text-center md:text-left">
                            Take Control of <br /> Your Path
                        </div>
                        <div className=" text-xl md:text-2xl mt-4 tracking-wide max-w-100 md:max-w-lg text-center md:text-left">
                            Transform complex chapters into clear goals with absolute clarity.
                        </div>
                    </div>
                    <div className="flex justify-center md:justify-start w-full">
                        <div className="rounded-full px-20 py-2 bg-blue-700 text-xl mt-6 cursor-pointer">
                            Get Started
                        </div>
                    </div>
                </div>
                <div className=" hidden md:flex items-center justify-center w-80 h-48 rounded-xl bg-black">
                    <div>
                        Image here
                    </div>
                </div>
            </div>

            {/*divider*/}
            <div className="w-full flex items-center justify-center mb-20">
                <div className="w-full h-px bg-gradient-to-l from-gray-500 to-transparent " />
                <div className="w-full h-px bg-gradient-to-r from-gray-500 to-transparent" />
            </div>

            {/* Choice Section */}
            <div>
                <div>
                    {grades.map((grade, index) => (
                        <div>

                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
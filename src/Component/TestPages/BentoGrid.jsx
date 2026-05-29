import { useMemo, useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';

const DEFAULT_BLOCKS = Array.from({ length: 9 }, (_, index) => ({
    id: index,
    title: `Block ${index}`,
    details: `Detailed explanation for Block ${index}.`,
}));

const DESKTOP_PLACEMENTS = {
    0: 'lg:col-start-2 lg:col-span-3 lg:row-start-4 lg:row-span-7',
    1: 'lg:col-start-4 lg:row-start-1 lg:row-span-3',
    2: 'lg:col-start-2 lg:row-start-1 lg:row-span-3',
    3: 'lg:col-start-3 lg:row-start-1 lg:row-span-3',
    4: 'lg:col-start-1 lg:row-start-3 lg:row-span-2',
    5: 'lg:col-start-1 lg:row-start-5 lg:row-span-2',
    6: 'lg:col-start-1 lg:row-start-7 lg:row-span-2',
    7: 'lg:col-start-1 lg:row-start-9 lg:row-span-2',
    8: 'lg:col-start-1 lg:row-start-1 lg:row-span-2',
};

const normalizeBlocks = (blocks) =>
    blocks.filter(Boolean).map((block, index) => ({
        id: block.id ?? index,
        title: block.title ?? `Block ${index}`,
        details: block.details ?? '',
    }));

export default function BentoGrid({ blocks: externalBlocks }) {
    const sourceBlocks = useMemo(
        () => normalizeBlocks(externalBlocks?.length ? externalBlocks : DEFAULT_BLOCKS),
        [externalBlocks],
    );
    const gridKey = sourceBlocks.map((block) => block.id).join('|');

    return <BentoGridBoard key={gridKey} initialBlocks={sourceBlocks} />;
}

function BentoGridBoard({ initialBlocks }) {
    const [blocks, setBlocks] = useState(initialBlocks);

    const handleBlockClick = (clickedIndex) => {
        if (clickedIndex === 0 || clickedIndex >= blocks.length) return;

        setBlocks((currentBlocks) => {
            const nextBlocks = [...currentBlocks];
            [nextBlocks[0], nextBlocks[clickedIndex]] = [nextBlocks[clickedIndex], nextBlocks[0]];
            return nextBlocks;
        });
    };

    if (blocks.length === 0) {
        return (
            <main className="min-h-screen bg-black p-3 text-white">
                <div className="flex min-h-[70vh] items-center justify-center rounded border border-white/60">
                    No blocks available.
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black p-3 text-white">
            <LayoutGroup>
                <section className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[980px] grid-cols-1 gap-1.5 lg:aspect-[1.24/1] lg:min-h-0 lg:grid-cols-4 lg:grid-rows-10">
                    {blocks.map((block, index) => (
                        <BentoCard
                            key={block.id}
                            block={block}
                            index={index}
                            isActive={index === 0}
                            onClick={() => handleBlockClick(index)}
                        />
                    ))}
                </section>
            </LayoutGroup>
        </main>
    );
}

function BentoCard({ block, index, isActive, onClick }) {
    return (
        <motion.button
            type="button"
            layout
            onClick={onClick}
            whileTap={isActive ? undefined : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className={`relative flex min-h-28 items-center justify-center overflow-hidden rounded border-2 border-white/80 bg-[#ea462b] text-xs font-bold text-white outline-none transition hover:bg-[#f04d31] focus:ring-2 focus:ring-white/80 lg:min-h-0 ${DESKTOP_PLACEMENTS[index] ?? ''}`}
            aria-label={isActive ? `${block.title} is selected` : `Show ${block.title}`}
        >
            {block.id}
        </motion.button>
    );
}

import { CATEGORIES, CATEGORY_COLORS } from '../lib/constants';

export function MapLegend() {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
      <div className="space-y-2">
        {CATEGORIES.map((category) => (
          <div key={category.id} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-md"
              style={{
                backgroundColor: CATEGORY_COLORS[category.id] || CATEGORY_COLORS.default,
              }}
            />
            <span className="text-sm text-gray-700">{category.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

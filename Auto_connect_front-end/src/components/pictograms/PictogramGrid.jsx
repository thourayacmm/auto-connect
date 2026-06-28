import { useAppPreferences } from "../../context/AppPreferences";
import PictogramCard from "./PictogramCard";

function PictogramGrid({ pictograms, onSelect, large = false }) {
  const { gridSize, gridOptions } = useAppPreferences();
  const gridClassName = large
    ? gridOptions[gridSize]?.childGridClass || gridOptions.medium.childGridClass
    : "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4";

  return (
    <div className={gridClassName}>
      {pictograms.map((pictogram) => (
        <PictogramCard
          key={pictogram.id}
          pictogram={pictogram}
          onSelect={onSelect}
          large={large}
        />
      ))}
    </div>
  );
}

export default PictogramGrid;

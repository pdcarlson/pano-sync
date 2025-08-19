// src/components/PrefixInput.jsx

// a component for the user to input the file prefix
function PrefixInput({ value, onChange }) {
  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-[#EDEDF0] bg-white p-4">
      <label htmlFor="prefix-input" className="text-xl font-light text-[#2D2D31]">
        2. Enter Naming Prefix
      </label>
      <input
        id="prefix-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., PROJECT_YYYYMMDD"
        className="w-full rounded-md border border-gray-300 p-2"
      />
    </div>
  );
}

export default PrefixInput;
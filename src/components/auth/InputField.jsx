const InputField = ({ label, type = "text", value, onChange, placeholder, name, error, hint, required = true, autoComplete }) => {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <div className="mb-5">
      <label className="block text-sm text-[#8B9494] mb-1.5" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`w-full px-4 py-2.5 rounded-md bg-[#0B0F10] text-[#EDEFEF] border placeholder:text-[#4A5455] outline-none transition-colors focus:border-[#3DDC97] ${
          error ? "border-[#F07178]" : "border-[#212A2C]"
        }`}
      />
      {error ? (
        <p id={`${name}-error`} className="text-xs text-[#F07178] mt-1">{error}</p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-xs text-[#4A5455] mt-1">{hint}</p>
      ) : null}
    </div>
  );
};

export default InputField;

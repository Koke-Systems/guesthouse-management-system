export default function NavBar({ onOpen, onSearch }) {
  return (
    <div className="navbar bg-base-100 shadow-sm px-5">
      <div className="flex-1">
        <h1 className="text-xl font-bold text-blue-600">Rooms Management</h1>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by room or property..."
          onChange={(e) => onSearch(e.target.value)}
          className="input input-bordered w-32 md:w-64"
        />
        <button className="btn btn-primary" onClick={onOpen}>
          + Add Room
        </button>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { createMiscEntry } from "../api/MiscAPI";

const NewMisc = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    category: "plan",
    entry_date: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting Data:", formData);
      const response = await createMiscEntry(formData);
      console.log("Success:", response);
      onClose();
      onSave(response);
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting misc entry");
    }
  };

  return (
    <div className="modal">
      <div className="new-misc-container">
        <div className="header-card">
          <p className="title">New Plan</p>
          <p className="close-btn" onClick={onClose}>
            &times;
          </p>
        </div>
        <hr />
        <form onSubmit={handleSubmit} className="form-container">
          <label>
            <input
              type="date"
              placeholder="Entry Date"
              name="entry_date"
              value={formData.entry_date}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <label>
            <input
              type="text"
              placeholder="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <button type="submit">Add</button>
        </form>
      </div>
    </div>
  );
};

export default NewMisc;

// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { createMiscEntry } from "../api/MiscAPI";

// const NewMisc = ({ onClose }) => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     category: "plan",
//     entry_date: "",
//     description: "",
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prevData) => ({
//       ...prevData,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       console.log("Submitting Data:", formData);
//       const response = await createMiscEntry(formData);
//       console.log("Success:", response);
//       onClose();
//       navigate("/trades", { replace: true });
//       window.location.reload();
//     } catch (error) {
//       console.error("Error:", error);
//       alert("Error submitting misc entry");
//     }
//   };

//   return (
//     <div className="modal">
//       <div className="new-misc-container">
//         <div className="header-card">
//           <p className="title">New Misc</p>
//           <p className="close-btn" onClick={onClose}>
//             &times;
//           </p>
//         </div>
//         <hr />
//         <form onSubmit={handleSubmit} className="form-container">
//           <label>
//             <select
//               name="category"
//               value={formData.category}
//               onChange={handleChange}
//               required
//             >
//               <option value="plan">Plan</option>
//               <option value="summary">Summary</option>
//               <option value="metrics">Metrics</option>
//             </select>
//           </label>

//           <br />
//           <label>
//             <input
//               type="date"
//               placeholder="Entry Date"
//               name="entry_date"
//               value={formData.entry_date}
//               onChange={handleChange}
//               required
//             />
//           </label>
//           <br />
//           <label>
//             <input
//               type="text"
//               placeholder="Description"
//               name="description"
//               value={formData.description}
//               onChange={handleChange}
//               required
//             />
//           </label>
//           <br />
//           <button type="submit">Add</button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default NewMisc;

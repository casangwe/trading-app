import React, { useState, useEffect } from "react";
import { fetchRules, updateRule, createRule } from "../api/RulesAPI";
import NewRule from "./NewRule";
import UpdateRule from "./UpdateRule";
import { formatDate } from "../func/functions";

const Rules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const getRules = async () => {
      try {
        const data = await fetchRules();
        setRules(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    getRules();
  }, []);

  const handleOpenModal = (rule = null) => {
    setSelectedRule(rule);
    setIsEditing(!!rule);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedRule(null);
    setIsEditing(false);
    setShowModal(false);
  };

  const handleSaveChanges = async (ruleData) => {
    try {
      if (isEditing) {
        await updateRule(selectedRule.id, ruleData);
      } else {
        await createRule(ruleData);
      }

      const refreshedRules = await fetchRules();
      setRules(refreshedRules);
    } catch (error) {
      console.error("Error saving rule:", error);
    } finally {
      handleCloseModal();
    }
  };

  return (
    <div className="rules-container">
      <div className="header-card">
        <p className="title">Rules</p>
        <div className="tooltip">
          <i
            className="btn btn-primary fa-solid fa-plus"
            id="rule-new-btn"
            onClick={() => handleOpenModal()}
          ></i>
          <span className="tooltiptext">New Rule</span>
        </div>
      </div>

      <hr />
      <div className="rules-list">
        {rules.map((rule, index) => {
          const ruleText = rule.rule.split("|")[0].trim();

          return (
            <div
              className="rule-item"
              key={rule.id}
              onClick={() => handleOpenModal(rule)}
            >
              <span className="rule-item-date">{index + 1}</span>
              <span className="rule-item-text">{ruleText}</span>
            </div>
          );
        })}
      </div>

      {showModal && isEditing && selectedRule && (
        <UpdateRule
          rule={selectedRule}
          onClose={handleCloseModal}
          onSave={handleSaveChanges}
        />
      )}

      {showModal && !isEditing && (
        <NewRule onClose={handleCloseModal} onSave={handleSaveChanges} />
      )}
    </div>
  );
};

export default Rules;

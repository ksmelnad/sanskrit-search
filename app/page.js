"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { IndicTransliterate } from "@ai4bharat/indic-transliterate";
import styles from "./page.module.css";
import Sanscript from "@indic-transliteration/sanscript";

function Search() {
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [docs, setDocs] = useState([]);
  const [docSet, setDocSet] = useState(new Set());
  const [selectedText, setSelectedText] = useState("सर्वम्");
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [sortedDocs, setSortedDocs] = useState([]);
  const [sort, setSort] = useState("order");
  const [isSarvam, setIsSarvam] = useState(true);
  const [numFound, setNumFound] = useState(0);
  const [queryString, setQueryString] = useState("");
  const [selection, setSelection] = useState("All");
  const [checkboxesEnabled, setCheckboxesEnabled] = useState(false);
  const [checkboxes, setCheckboxes] = useState({
    ब्रह्मसूत्राणि: false,
    शारीरकभाष्यम्: false,
    दीपिका: false,
    तर्कसङ्ग्रहः: false,
    शतश्लोकी: false,
    विवेकचूडामणिः: false,
    वेदान्तसारः: false,
    रघुवंशम्: false,
    आर्यभटीयम्: false,
    लीलावतीगणितम्: false,
    सूर्यसिद्धान्तः: false,
    खण्डखाद्यकम्: false,
    योगसूत्रम्: false,
    मेघदूतम्: false,
    ईशावास्योपनिषद्: false,
  });
  const [texts, setTexts] = useState([]);
  const [isAiBharat, setIsAiBharat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [script, setScript] = useState("itrans");

  if (isAiBharat) {
    document.querySelector(
      ".page_searchinput___6px7"
    ).parentNode.style.minWidth = "80vw";
  }

  const scripts = {
    itrans: "ITRANS",
    devanagari: "Devanagari",
    iast: "IAST",
    hk: "Harvard-Kyoto",
    slp1: "SLP1",
    velthuis: "Velthuis",
    wx: "WX",
    kannada: "Kannada",
    malayalam: "Malayalam",
    tamil: "Tamil",
    telugu: "Telugu",
    bengali: "Bengali",
    gurmukhi: "Gurmukhi",
    gujarati: "Gujarati",
    oriya: "Oriya",
  };

  function handleSelectionChange(event) {
    const value = event.target.value;

    setSelection(value);
    if (value === "Select") {
      setCheckboxesEnabled(true);
    } else {
      setCheckboxesEnabled(false);
    }
  }

  function handleCheckboxChange(event) {
    const name = event.target.name;
    const isChecked = event.target.checked;
    setCheckboxes({ ...checkboxes, [name]: isChecked });
  }

  useEffect(() => {
    let texts = [];
    Object.entries(checkboxes).map(([key, value]) => {
      if (value) {
        texts.push(key);
      }
    });
    setTexts(texts);

    if (selection === "All") {
      let allTexts = [];
      Object.entries(checkboxes).map(([key, value]) => {
        allTexts.push(key);
      });
      setTexts(allTexts);
    }
  }, [checkboxes, selection]);

  const onSubmitHandler = (e) => {
    e.preventDefault();
    setIsFirstLoad(false);
    setSelectedText("सर्वम्");

    if (queryString.trim() === "") {
      alert("Query cannot be empty");
      return;
    }

    if (selection === "Select") {
      if (texts.length === 0) {
        alert("Please select at least one text");
        return;
      }
    }

    const handleSearchSolr = async () => {
      setIsLoading(true);
      setIsError(false);
      docSet.clear();

      try {
        const res = await axios.post("/api/solr", {
          queryString,
          texts,
        });

        const data = res.data;

        const { response } = data;
        const { docs } = response;

        setNumFound(response.numFound);
        setDocs(docs);

        docs.map((doc) => {
          if (!docSet.has(doc.name[0])) {
            docSet.add("सर्वम्");
            docSet.add(doc.name[0]);
            setDocSet(docSet);
          }
        });
        setIsSarvam(true);
        setFilteredDocs(docs);
        setIsLoading(false);
      } catch (error) {
        console.log(error);
        setIsError(true);
      }
    };
    handleSearchSolr();
  };

  useEffect(() => {
    const handleSortedDocs = () => {
      if (isSarvam) {
        setSort("relevance");
        setSortedDocs(filteredDocs);
        return;
      }
      if (sort === "order") {
        const sortingDocs = [...filteredDocs].sort((a, b) => {
          const refA = refNumber(a.word_id[0])[1];
          const refB = refNumber(b.word_id[0])[1];
          return refA - refB;
        });
        setSortedDocs(sortingDocs);
        return;
      }
      if (sort === "relevance") {
        setSortedDocs(filteredDocs);
        return;
      }
    };
    handleSortedDocs();
  }, [sort, isSarvam, filteredDocs]);

  useEffect(() => {
    const handleFilterDocs = () => {
      setSort("order");
      if (selectedText === "सर्वम्") {
        setIsSarvam(true);
        setFilteredDocs(docs);
        return;
      }
      setIsSarvam(false);

      setFilteredDocs(
        docs.filter((docItem) => docItem.name[0] === selectedText)
      );
    };
    handleFilterDocs();
  }, [selectedText, docs]);

  const refNumber = (word_id) => {
    if (word_id.includes("SC1")) {
      const regex = /SC1:(\d+)/;
      const match = word_id.match(regex);
      const number = match?.[1];
      const regexCID = /\_CID:(\d+)/;
      const matchCID = word_id.match(regexCID);
      const numberCID = matchCID?.[1];

      return [number, numberCID];
    } else {
      return [0, 0];
    }
  };

  function highlightText(text) {
    const words = queryString.split(/\s+/);

    if (queryString.trim() === "") {
      return text;
    }

    const regex = new RegExp(words.join("|"), "gi");
    const highlighted = text.replace(
      regex,
      (match) => `<span style="background-color: yellow">${match}</span>`
    );
    return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
  }

  const handleScriptChange = (event) => {
    event.preventDefault();
    setScript(event.target.value);
  };

  const handleSanskriptChange = (value) => {
    const output = Sanscript.t(value, script, "devanagari");
    setQueryString(output);
  };

  const printDocs = () => {
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {Array.from(docSet).map((doc, index) => {
          return (
            <button
              key={index}
              style={{
                paddingLeft: "0.5rem",
                paddingRight: "0.5rem",
                paddingTop: "0.25rem",
                paddingBottom: "0.25rem",
                border: "1px solid #ccc",
                cursor: "pointer",
                backgroundColor:
                  (isSarvam && doc === "सर्वम्") ||
                  (!isSarvam && doc === selectedText)
                    ? "#3d3d3d"
                    : "#ededed",

                color:
                  (isSarvam && doc === "सर्वम्") ||
                  (!isSarvam && doc === selectedText)
                    ? "#fff"
                    : "#000",
              }}
              onClick={() => setSelectedText(doc)}
            >
              {doc}
            </button>
          );
        })}
      </div>
    );
  };

  const printResults = () => {
    if (isError) {
      return (
        <div>
          <p>Error occured while searching. Please check the query.</p>
        </div>
      );
    }
    if (isLoading) {
      return (
        <div>
          <p>Loading...</p>
        </div>
      );
    }
    if (docs.length === 0 && isFirstLoad === false) {
      return <span style={{ color: "#a70e0e" }}>फलितांशः नास्ति ! </span>;
    } else {
      return (
        <>
          <div
            style={{ display: "flex", gap: "1rem", flexDirection: "column" }}
          >
            {docs.length !== 0 && printDocs()}
            {docs.length !== 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingRight: "1rem",
                  paddingLeft: "1rem",
                }}
              >
                <div
                  style={{
                    color: "green",
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                  }}
                >
                  फलितांशः (Result) : {filteredDocs.length}
                </div>
                {!isSarvam && (
                  <div>
                    <span style={{ paddingRight: "0.5rem" }}>Sort by</span>
                    <select
                      style={{
                        padding: "0.5rem",
                        border: "1px solid #ccc",
                        borderRadius: "5px",
                      }}
                      onChange={(e) => setSort(e.target.value)}
                      value={sort}
                    >
                      <option value="order">Order</option>
                      <option value="relevance">Relevance</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <div>
              {sortedDocs.map((doc, index) => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    paddingLeft: "1rem",
                    paddingRight: "1rem",
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                    marginBottom: "1rem",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#a70e0e" }}>
                      {" "}
                      {doc.name[0]}{" "}
                      {refNumber(doc.word_id[0])[0] +
                        "." +
                        refNumber(doc.word_id[0])[1]}
                    </span>

                    <a href="#" style={{ color: "blue" }}>
                      अग्रे पठन्तु ...
                    </a>
                  </div>
                  <div>{highlightText(doc.word)}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <div
      style={{
        padding: "1rem 2.5rem 1rem 2.5rem",
        width: "90vw",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ color: "#a70e0e" }}>संस्कृतवाङ्मयान्वेषणम्</h1>
        </div>
        <div
          style={{
            display: "flex",

            gap: "5px",
            alignItems: "center",
          }}
        >
          <span>Google Input Tools</span>
          <button
            className={styles.aibharatbtn}
            style={{
              backgroundColor: isAiBharat ? "#48bb78" : "#f56565",
              borderColor: isAiBharat ? "#48bb78" : "#f56565",
            }}
            onClick={() => setIsAiBharat(!isAiBharat)}
          >
            {isAiBharat ? `On` : `Off`}
          </button>
        </div>
      </div>

      <form onSubmit={onSubmitHandler}>
        {isAiBharat ? (
          <IndicTransliterate
            className={styles.searchinput}
            value={queryString}
            placeholder="पृच्छा (Query)"
            onChangeText={(text) => {
              setQueryString(text);
            }}
            lang="sa"
          />
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <select
              onChange={handleScriptChange}
              style={{
                padding: "0.5rem",
                borderRadius: "0.25rem",
                border: "1px solid #ccc",
                maxWidth: "max-content",
              }}
            >
              {Object.keys(scripts).map((key) => (
                <option key={key} value={key}>
                  {scripts[key]}
                </option>
              ))}
            </select>
            <input
              type="text"
              className={styles.searchinput}
              placeholder="पृच्छा (Query)"
              onChange={(e) => handleSanskriptChange(e.target.value)}
            />
            <div style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
              {queryString ? (
                queryString
              ) : (
                <span style={{ color: "white" }}>अ</span>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!queryString}
          className={styles.searchbtn}
        >
          अन्वेष्यताम् (Search)
        </button>
      </form>

      <div style={{ paddingTop: "1.25rem", paddingBottom: "1.25rem" }}>
        <div style={{ display: "flex", gap: "1rem", paddingBottom: "1.25rem" }}>
          <label>
            <input
              type="radio"
              name="selection"
              value="All"
              checked={selection === "All"}
              onChange={handleSelectionChange}
            />
            <span style={{ paddingLeft: "0.5rem", paddingRight: "0.5rem" }}>
              सर्वत्र
            </span>
          </label>
          <label>
            <input
              type="radio"
              name="selection"
              value="Select"
              checked={selection === "Select"}
              onChange={handleSelectionChange}
            />
            <span style={{ paddingLeft: "0.5rem", paddingRight: "0.5rem" }}>
              ग्रन्थचयनम्
            </span>
          </label>
        </div>
        {checkboxesEnabled && (
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {Object.entries(checkboxes).map(([key, value]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  name={key}
                  checked={value}
                  onChange={handleCheckboxChange}
                />
                <span style={{ paddingLeft: "0.5rem", paddingRight: "0.5rem" }}>
                  {key}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
      {docs && printResults()}
    </div>
  );
}

export default Search;

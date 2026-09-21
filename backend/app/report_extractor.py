import io
import re
from typing import Dict, Any, Tuple, Optional
from PIL import Image
import pypdf

try:
    import pytesseract
except ImportError:
    pytesseract = None


def extract_raw_text(file_bytes: bytes, filename: str) -> str:
    """
    Extract raw text content from uploaded PDF or Image file bytes.
    """
    ext = filename.lower().split(".")[-1]
    raw_text = ""

    if ext == "pdf":
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            text_pages = []
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text_pages.append(t)
            raw_text = "\n".join(text_pages)
        except Exception as e:
            print(f"Error reading PDF with pypdf: {e}")

        # If PDF is scanned (no text extracted), try OCR if pytesseract is available
        if not raw_text.strip() and pytesseract is not None:
            try:
                # We attempt basic image rendering if fitz/pdf2image were available,
                # but with pypdf we can extract images inside pages if present
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                for page in reader.pages:
                    for count, image_file_object in enumerate(page.images):
                        img = Image.open(io.BytesIO(image_file_object.data))
                        ocr_txt = pytesseract.image_to_string(img)
                        if ocr_txt:
                            raw_text += "\n" + ocr_txt
            except Exception as e:
                print(f"Error executing OCR on PDF image streams: {e}")

    elif ext in ["jpg", "jpeg", "png"]:
        if pytesseract is not None:
            try:
                img = Image.open(io.BytesIO(file_bytes))
                raw_text = pytesseract.image_to_string(img)
            except Exception as e:
                print(f"Error running pytesseract on image: {e}")
        else:
            print("pytesseract engine not available for image OCR.")

    return raw_text.strip()


def parse_heart_disease(text: str) -> Dict[str, Any]:
    """
    Extract 13 Heart Disease clinical fields from raw text.
    Returns dictionary with field status and values.
    Missing fields are marked with value = None / "Not found".
    """
    text_lower = text.lower()
    fields = {}

    # 1. Age
    age_match = re.search(r"(?:age|patient\s+age|years\s+old)[\s:]*([0-9]{1,3})", text_lower)
    if age_match:
        fields["age"] = float(age_match.group(1))
    else:
        fields["age"] = None

    # 2. Sex (1=Male, 0=Female)
    sex_match = re.search(r"(?:sex|gender)[\s:]*(male|female|m|f|1|0)", text_lower)
    if sex_match:
        val = sex_match.group(1)
        if val in ["male", "m", "1"]:
            fields["sex"] = 1.0
        elif val in ["female", "f", "0"]:
            fields["sex"] = 0.0
        else:
            fields["sex"] = None
    else:
        fields["sex"] = None

    # 3. Chest Pain Type (cp: 1, 2, 3, 4)
    if re.search(r"asymptomatic|no\s+chest\s+pain|chest\s+pain\s*(?:type)?\s*[:=]?\s*4", text_lower):
        fields["cp"] = 4.0
    elif re.search(r"non[\s-]anginal|non\s+anginal|chest\s+pain\s*(?:type)?\s*[:=]?\s*3", text_lower):
        fields["cp"] = 3.0
    elif re.search(r"atypical\s+angina|atypical|chest\s+pain\s*(?:type)?\s*[:=]?\s*2", text_lower):
        fields["cp"] = 2.0
    elif re.search(r"typical\s+angina|typical|chest\s+pain\s*(?:type)?\s*[:=]?\s*1", text_lower):
        fields["cp"] = 1.0
    elif "chest pain" in text_lower or "angina" in text_lower:
        fields["cp"] = 1.0  # default typical angina if pain reported without subtype
    else:
        fields["cp"] = None

    # 4. Resting Blood Pressure (trestbps)
    bp_match = re.search(r"(?:resting\s+blood\s+pressure|blood\s+pressure|bp|trestbps)[\s:]*([0-9]{2,3})(?:\/([0-9]{2,3}))?", text_lower)
    if bp_match:
        fields["trestbps"] = float(bp_match.group(1))
    else:
        fields["trestbps"] = None

    # 5. Serum Cholesterol (chol)
    chol_match = re.search(r"(?:total\s+cholesterol|serum\s+cholesterol|cholesterol|chol)[\s:]*([0-9]{2,3})", text_lower)
    if chol_match:
        fields["chol"] = float(chol_match.group(1))
    else:
        fields["chol"] = None

    # 6. Fasting Blood Sugar (fbs: 1 if >120, 0 if <=120)
    fbs_num_match = re.search(r"(?:fasting\s+blood\s+sugar|fasting\s+sugar|fbs)[\s:]*([0-9]{2,3})", text_lower)
    if fbs_num_match:
        val = float(fbs_num_match.group(1))
        fields["fbs"] = 1.0 if val > 120 else 0.0
    elif "fasting blood sugar > 120" in text_lower or "high fasting sugar" in text_lower:
        fields["fbs"] = 1.0
    elif "fasting blood sugar <= 120" in text_lower or "normal fasting sugar" in text_lower:
        fields["fbs"] = 0.0
    else:
        fields["fbs"] = None

    # 7. Resting ECG (restecg: 0=normal, 1=ST-T abnormality, 2=LV hypertrophy)
    if re.search(r"hypertrophy|lv\s+hypertrophy|restecg\s*[:=]?\s*2", text_lower):
        fields["restecg"] = 2.0
    elif re.search(r"st[\s-]t\s+abnormality|st[\s-]t\s+wave|restecg\s*[:=]?\s*1", text_lower):
        fields["restecg"] = 1.0
    elif re.search(r"normal\s+(?:ecg|electrocardiogram)|restecg\s*[:=]?\s*0", text_lower):
        fields["restecg"] = 0.0
    elif "resting ecg" in text_lower or "ecg" in text_lower:
        if "normal" in text_lower:
            fields["restecg"] = 0.0
        else:
            fields["restecg"] = None
    else:
        fields["restecg"] = None

    # 8. Maximum Heart Rate (thalach)
    hr_match = re.search(r"(?:max(?:imum)?\s+heart\s+rate|peak\s+heart\s+rate|thalach|hr\s+max)[\s:]*([0-9]{2,3})", text_lower)
    if hr_match:
        fields["thalach"] = float(hr_match.group(1))
    else:
        fields["thalach"] = None

    # 9. Exercise-Induced Angina (exang: 1=Yes, 0=No)
    if re.search(r"exercise[\s-]induced\s+angina[\s:]*(yes|present|1|positive)", text_lower) or "exercise induced angina: yes" in text_lower:
        fields["exang"] = 1.0
    elif re.search(r"exercise[\s-]induced\s+angina[\s:]*(no|absent|0|negative)", text_lower) or "no exercise induced angina" in text_lower or "exercise induced angina: no" in text_lower:
        fields["exang"] = 0.0
    elif "exercise-induced angina" in text_lower or "exang" in text_lower:
        if "no" in text_lower or "absent" in text_lower:
            fields["exang"] = 0.0
        elif "yes" in text_lower or "present" in text_lower:
            fields["exang"] = 1.0
        else:
            fields["exang"] = None
    else:
        fields["exang"] = None

    # 10. ST Depression (oldpeak)
    oldpeak_match = re.search(r"(?:st\s+depression|oldpeak)[\s:]*([0-9]+(?:\.[0-9]+)?)", text_lower)
    if oldpeak_match:
        fields["oldpeak"] = float(oldpeak_match.group(1))
    else:
        fields["oldpeak"] = None

    # 11. Slope of Peak ST (slope: 1=Upsloping, 2=Flat, 3=Downsloping)
    if re.search(r"downsloping|st\s+slope\s*[:=]?\s*3|slope\s*[:=]?\s*3", text_lower):
        fields["slope"] = 3.0
    elif re.search(r"flat|st\s+slope\s*[:=]?\s*2|slope\s*[:=]?\s*2", text_lower):
        fields["slope"] = 2.0
    elif re.search(r"upsloping|st\s+slope\s*[:=]?\s*1|slope\s*[:=]?\s*1", text_lower):
        fields["slope"] = 1.0
    else:
        fields["slope"] = None

    # 12. Major Vessels (ca: 0-3)
    ca_match = re.search(r"(?:number\s+of\s+major\s+vessels|major\s+vessels|coronary\s+vessels|ca)[\s:]*([0-3])", text_lower)
    if ca_match:
        fields["ca"] = float(ca_match.group(1))
    else:
        fields["ca"] = None

    # 13. Thalassemia (thal: 3=Normal, 6=Fixed defect, 7=Reversible defect)
    if re.search(r"reversible\s+defect|thal\s*[:=]?\s*7", text_lower):
        fields["thal"] = 7.0
    elif re.search(r"fixed\s+defect|thal\s*[:=]?\s*6", text_lower):
        fields["thal"] = 6.0
    elif re.search(r"normal\s+thalassemia|normal|thal\s*[:=]?\s*3", text_lower):
        fields["thal"] = 3.0
    else:
        fields["thal"] = None

    return fields


def parse_lung_cancer(text: str) -> Dict[str, Any]:
    """
    Extract 15 Lung Cancer clinical inputs from raw text.
    Returns dictionary with field values or None if not found.
    """
    text_lower = text.lower()
    fields = {}

    # 1. AGE
    age_match = re.search(r"(?:age|patient\s+age|years\s+old)[\s:]*([0-9]{1,3})", text_lower)
    if age_match:
        fields["AGE"] = float(age_match.group(1))
    else:
        fields["AGE"] = None

    # 2. GENDER (1=Male, 0=Female)
    sex_match = re.search(r"(?:sex|gender)[\s:]*(male|female|m|f|1|0)", text_lower)
    if sex_match:
        val = sex_match.group(1)
        if val in ["male", "m", "1"]:
            fields["GENDER"] = 1.0
        elif val in ["female", "f", "0"]:
            fields["GENDER"] = 0.0
        else:
            fields["GENDER"] = None
    else:
        fields["GENDER"] = None

    # Helper function for symptoms / binary habits
    def check_binary_symptom(positive_keywords, negative_keywords):
        for neg in negative_keywords:
            if neg in text_lower:
                return 0.0
        for pos in positive_keywords:
            if pos in text_lower:
                return 1.0
        return None

    # 3. SMOKING
    fields["SMOKING"] = check_binary_symptom(
        ["smoker", "smoking history", "smokes", "history of smoking", "smoking: yes", "smoking: 1"],
        ["non-smoker", "never smoked", "no smoking", "smoking: no", "smoking: 0"]
    )

    # 4. YELLOW_FINGERS
    fields["YELLOW_FINGERS"] = check_binary_symptom(
        ["yellow fingers", "yellowing of fingers", "yellow_fingers: yes"],
        ["no yellow fingers", "yellow_fingers: no"]
    )

    # 5. ANXIETY
    fields["ANXIETY"] = check_binary_symptom(
        ["anxiety", "anxious", "anxiety: yes"],
        ["no anxiety", "anxiety: no"]
    )

    # 6. PEER_PRESSURE
    fields["PEER_PRESSURE"] = check_binary_symptom(
        ["peer pressure", "peer_pressure: yes"],
        ["no peer pressure", "peer_pressure: no"]
    )

    # 7. CHRONIC DISEASE
    fields["CHRONIC DISEASE"] = check_binary_symptom(
        ["chronic disease", "chronic respiratory", "copd", "asthma", "chronic_disease: yes"],
        ["no chronic disease", "chronic_disease: no"]
    )

    # 8. FATIGUE
    fields["FATIGUE"] = check_binary_symptom(
        ["fatigue", "exhaustion", "tiredness", "fatigue: yes"],
        ["no fatigue", "fatigue: no"]
    )

    # 9. ALLERGY
    fields["ALLERGY"] = check_binary_symptom(
        ["allergy", "allergies", "allergic", "allergy: yes"],
        ["no allergy", "no allergies", "allergy: no"]
    )

    # 10. WHEEZING
    fields["WHEEZING"] = check_binary_symptom(
        ["wheezing", "wheeze", "wheezing: yes"],
        ["no wheezing", "wheezing: no"]
    )

    # 11. ALCOHOL CONSUMING
    fields["ALCOHOL CONSUMING"] = check_binary_symptom(
        ["alcohol consumption", "alcohol intake", "drinks alcohol", "alcohol: yes"],
        ["no alcohol", "non-drinker", "alcohol: no"]
    )

    # 12. COUGHING
    fields["COUGHING"] = check_binary_symptom(
        ["persistent cough", "coughing", "cough", "coughing: yes"],
        ["no cough", "no coughing", "coughing: no"]
    )

    # 13. SHORTNESS OF BREATH
    fields["SHORTNESS OF BREATH"] = check_binary_symptom(
        ["shortness of breath", "dyspnea", "breathlessness", "shortness_of_breath: yes"],
        ["no shortness of breath", "shortness_of_breath: no"]
    )

    # 14. SWALLOWING DIFFICULTY
    fields["SWALLOWING DIFFICULTY"] = check_binary_symptom(
        ["swallowing difficulty", "dysphagia", "difficulty swallowing", "swallowing_difficulty: yes"],
        ["no swallowing difficulty", "swallowing_difficulty: no"]
    )

    # 15. CHEST PAIN
    fields["CHEST PAIN"] = check_binary_symptom(
        ["chest pain", "thoracic pain", "chest_pain: yes"],
        ["no chest pain", "chest_pain: no"]
    )

    return fields


def parse_breast_cancer(text: str) -> Dict[str, Any]:
    """
    Extract 10 user-facing Breast Cancer mean feature fields from text if present.
    Returns None for any field not explicitly found in report text.
    """
    text_lower = text.lower()
    fields = {}

    feature_regexes = {
        "mean radius": r"(?:mean\s+radius|tumor\s+radius|radius)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "mean texture": r"(?:mean\s+texture|texture)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "mean perimeter": r"(?:mean\s+perimeter|perimeter)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "mean area": r"(?:mean\s+area|area)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "mean smoothness": r"(?:mean\s+smoothness|smoothness)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "mean compactness": r"(?:mean\s+compactness|compactness)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "mean concavity": r"(?:mean\s+concavity|concavity)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "mean concave points": r"(?:mean\s+concave\s+points|concave\s+points)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "mean symmetry": r"(?:mean\s+symmetry|symmetry)[\s:]*([0-9]+(?:\.[0-9]+)?)",
        "mean fractal dimension": r"(?:mean\s+fractal\s+dimension|fractal\s+dimension)[\s:]*([0-9]+(?:\.[0-9]+)?)"
    }

    for key, pattern in feature_regexes.items():
        match = re.search(pattern, text_lower)
        if match:
            fields[key] = float(match.group(1))
        else:
            fields[key] = None

    return fields


def process_report_file(file_bytes: bytes, filename: str, disease: str) -> Dict[str, Any]:
    """
    Main extraction pipeline:
    1. Extract text from PDF / Image.
    2. Route to disease-specific parser.
    3. Return extracted fields structure.
    """
    text = extract_raw_text(file_bytes, filename)
    disease_clean = disease.lower()

    if "heart" in disease_clean:
        extracted = parse_heart_disease(text)
    elif "lung" in disease_clean:
        extracted = parse_lung_cancer(text)
    elif "breast" in disease_clean:
        extracted = parse_breast_cancer(text)
    else:
        extracted = {}

    found_count = sum(1 for v in extracted.values() if v is not None)
    total_count = len(extracted)

    return {
        "disease": disease,
        "filename": filename,
        "raw_text_length": len(text),
        "text_extracted": len(text) > 0,
        "extracted_fields": extracted,
        "stats": {
            "found": found_count,
            "total": total_count,
            "missing": total_count - found_count
        }
    }

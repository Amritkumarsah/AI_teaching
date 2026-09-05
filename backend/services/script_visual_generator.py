import re
from typing import Dict, Any, List

class ScriptVisualGenerator:
    """
    VISUAL REASONING ENGINE & MULTI-LEVEL SCRIPT GENERATOR
    -------------------------------------------------------
    Supports 3 distinct pedagogical difficulty tiers:
    1. Basic (सरल): Intuitive everyday analogies, simple story-first explanations, zero intimidating math.
    2. Medium (प्रैक्टिकल): Practical engineering, cause-and-effect mechanisms, algebraic formulas with SI units.
    3. Hard (डीप डाइव): Rigorous mathematical derivations (calculus, tensors, differential equations), non-inertial frames, theoretical invariants.
    """

    @staticmethod
    def generate_node_content(concept: Dict[str, Any], language: str = "en", level: str = "basic") -> Dict[str, Any]:
        cid = concept.get("id", "c1")
        title = concept.get("title", "")
        visual_type = concept.get("visual_type", "CONCEPT_CARD")
        raw_text = concept.get("raw_text") or concept.get("explanation") or concept.get("explanation_focus") or ""
        focus = concept.get("explanation_focus") or concept.get("explanation") or raw_text
        key_terms = concept.get("key_terms") or []

        # Normalize level strictly to "basic" | "medium" | "hard"
        norm_level = "basic"
        lvl_lower = str(level).lower()
        if lvl_lower in ["intermediate", "medium", "practical"]:
            norm_level = "medium"
        elif lvl_lower in ["advanced", "hard", "rigorous", "deep"]:
            norm_level = "hard"

        # Domain detection
        combo_text = (title + " " + raw_text + " " + " ".join(key_terms)).lower()
        if any(w in combo_text for w in ["transformer", "llm", "language model", "attention", "neural", "deep learning", "embedding", "gpt", "token"]):
            detected_domain = "ai"
        elif any(w in combo_text for w in ["photo", "chloroplast", "dna", "cell", "bio", "plant", "genetic", "mitochondria"]):
            detected_domain = "biology"
        elif any(w in combo_text for w in ["atom", "chem", "electron", "molecule", "reaction", "bond", "periodic"]):
            detected_domain = "chemistry"
        elif any(w in combo_text for w in ["algorithm", "sort", "tree", "binary", "data structure", "graph", "code", "programming"]):
            detected_domain = "cs"
        elif any(w in combo_text for w in ["newton", "gravity", "orbit", "force", "velocity", "friction", "inertia", "physics", "vector"]):
            detected_domain = "physics"
        else:
            detected_domain = "general"

        title_lower = title.lower()
        is_hardcoded_newton = (
            cid in ["c1", "c2", "c3", "c4"]
            and not cid.startswith("custom_")
            and any(k in title_lower for k in ["newton", "inertia", "galileo", "f=ma", "action-reaction", "free fall in vacuum"])
        )

        if is_hardcoded_newton:
            scripts = ScriptVisualGenerator._get_multilingual_scripts(cid, title, norm_level)
            script_text = scripts.get(language, scripts.get("en", ""))
            visual_data = ScriptVisualGenerator._generate_visual_data(cid, visual_type, title, language, norm_level)
        else:
            # Custom uploaded PPTX, PDF, DOCX, TXT or dynamic topic
            script_text = ScriptVisualGenerator._generate_custom_script(title, raw_text, focus, key_terms, language, norm_level, detected_domain)
            visual_data = ScriptVisualGenerator._generate_custom_visual(title, raw_text, focus, key_terms, visual_type, detected_domain, norm_level)

        # Generate level-tailored checkpoint question
        checkpoint = ScriptVisualGenerator._get_level_checkpoint(
            cid=cid,
            title=title,
            level=norm_level,
            language=language,
            domain=detected_domain,
            default_cp=concept.get("checkpoint_question") or concept.get("checkpoint")
        )
        if isinstance(checkpoint, dict):
            checkpoint.setdefault("type", "mcq")

        visual_data["detected_domain"] = detected_domain
        visual_data["explanation_mode"] = norm_level

        return {
            "concept_id": cid,
            "title": title,
            "language": language,
            "level": norm_level,
            "detected_domain": detected_domain,
            "visual_type": visual_type,
            "spoken_script": script_text,
            "visual_data": visual_data,
            "checkpoint": checkpoint
        }

    # =========================================================================
    # 1. MULTILINGUAL SCRIPTS ADAPTED TO LEVEL (BASIC / MEDIUM / HARD)
    # =========================================================================
    @staticmethod
    def _get_multilingual_scripts(cid: str, title: str, level: str) -> Dict[str, str]:
        title_lower = title.lower()

        # ----------------- FIRST LAW / INERTIA -----------------
        if "inertia" in title_lower or "galileo" in title_lower or "first law" in title_lower:
            if level == "basic":
                return {
                    "en": (
                        "Hello! Let's understand Newton's First Law of Inertia in the simplest way possible. "
                        "Imagine you are riding a skateboard or bicycle on a smooth road. "
                        "If you stop pedaling, you slowly slow down only because of friction and air resistance. "
                        "Now imagine floating in deep outer space with zero friction. If you throw a ball there, "
                        "it will literally glide forward forever at the exact same speed in a straight line, without any engine! "
                        "That natural stubbornness of every object to keep doing what it is already doing is called Inertia. "
                        "A heavy bowling ball has high inertia and is hard to stop; a tennis ball has low inertia. "
                        "Look at the friendly diagram on your screen!"
                    ),
                    "hi": (
                        "नमस्ते! आज हम न्यूटन के पहले नियम यानी 'जड़त्व' (Inertia) को सबसे आसान तरीके से समझेंगे। "
                        "सोचिए आप साइकिल चला रहे हैं और पैडल मारना बंद कर देते हैं। साइकिल धीरे-धीरे क्यों रुक जाती है? "
                        "सिर्फ ज़मीन के घर्षण और हवा के दबाव की वजह से! "
                        "लेकिन अगर आप अंतरिक्ष के निर्वात में एक गेंद फेंक दें, तो वह बिना किसी इंजन के हमेशा के लिए सीधी रेखा में चलती रहेगी! "
                        "वस्तु के इसी स्वभाव को हम 'जड़त्व' कहते हैं: जो वस्तु रुकी है वह रुकी रहना चाहती है, और जो चल रही है वह चलती रहना चाहती है। "
                        "भारी गेंद का जड़त्व ज़्यादा होता है, और हल्की गेंद का कम। स्क्रीन पर बने इस सरल चित्र को देखिए!"
                    ),
                    "hinglish": (
                        "Hello! Aaj hum Newton ke First Law yaani 'Inertia' ko ekdum simple real-world example se samjhenge. "
                        "Sochiye aap skateboard par chal rahe hain. Push karna band karte hi skateboard rukta hai sirf friction ki wajah se! "
                        "Lekin agar aap deep space mein ek ball ko kick karein jahan zero friction hai, toh woh bina ruke hamesha straight line mein glide karti rahegi! "
                        "Kisi bhi cheez ki is natural zid ko hum 'Inertia' kehte hain. Heavy bowling ball ko rokna mushkil hai, light tennis ball ko aasan. "
                        "Screen par clean visual dekhiye!"
                    )
                }
            elif level == "hard":
                return {
                    "en": (
                        "Welcome to this advanced theoretical breakdown of Inertial Reference Frames and Galilean Relativity. "
                        "Formally, Newton's First Law is not a mere trivial sub-case of F=ma; it defines the existence of Inertial Coordinate Frames. "
                        "In an accelerating or rotating frame, the equation of motion necessitates fictitious forces: the Coriolis force, centrifugal acceleration, and Euler force. "
                        "According to Emmy Noether's theorem, spatial homogeneity directly implies the conservation of linear momentum. "
                        "Observe the chalkboard: when the spatial gradient of the Lagrangian vanishes, the conjugate momentum remains strictly invariant over time. "
                        "Examine the tensor representation of inertial coordinate transformations."
                    ),
                    "hi": (
                        "न्यूटन के प्रथम नियम और जड़त्वीय निर्देश तंत्र (Inertial Frames) के गहन सैद्धांतिक विश्लेषण में आपका स्वागत है। "
                        "सैद्धांतिक भौतिकी में प्रथम नियम केवल F=ma का विशेष मामला नहीं है, बल्कि यह उन संदर्भ तंत्रों को परिभाषित करता है जहाँ छद्म बल अनुपस्थित होते हैं। "
                        "त्वरित अथवा घूर्णन तंत्रों में कोरिओलिस और अपकेंद्रीय बल का समावेश करना अनिवार्य होता है। "
                        "नोएदर के प्रमेय के अनुसार समष्टि की एकरूपता ही रैखिक संवेग के संरक्षण को जन्म देती है। "
                        "स्क्रीन पर दिए गए लैग्रेंजियन सूत्रीकरण और गणितीय समीकरणों को गहराई से समझिए।"
                    ),
                    "hinglish": (
                        "Welcome to the rigorous deep-dive on Newton's First Law and Inertial Reference Frames! "
                        "Formally, First Law defines the coordinate systems in which Newtonian mechanics is valid without pseudo-forces. "
                        "Non-inertial accelerating frames mein Coriolis aur centrifugal fictitious forces consider karni padti hain. "
                        "Noether's theorem ke according, spatial translation symmetry linear momentum conservation ko derive karti hai. "
                        "Board par differential equations aur Lagrangian mechanics ke formulation ko analyze kijiye."
                    )
                }
            else: # medium (practical)
                return {
                    "en": (
                        "Welcome to our practical session on Newton's First Law and Applied Inertia. "
                        "In engineering and daily mechanisms, Newton's First Law states: when the net external force on a body is zero, its acceleration is zero. "
                        "Consider automotive safety engineering: when a car cruising at 60 km/h suddenly brakes, the vehicle stops, but the passengers' bodies continue moving forward at 60 km/h due to inertia. "
                        "That is why seatbelts and pre-tensioner mechanisms are engineered to apply an opposing restraint force. "
                        "Notice the balanced vector diagram on your screen: when engine thrust precisely equals rolling friction and air drag, velocity remains constant."
                    ),
                    "hi": (
                        "न्यूटन के प्रथम नियम के व्यावहारिक और प्रैक्टिकल अध्ययन में आपका स्वागत है। "
                        "इंजीनियरिंग में यह नियम कहता है: यदि किसी वस्तु पर लगने वाला कुल बाह्य बल शून्य हो, तो उसका त्वरण शून्य होगा। "
                        "कार सुरक्षा प्रणाली इसका सबसे बड़ा उदाहरण है: जब 60 किमी/घंटा की गति से चल रही कार अचानक ब्रेक लगाती है, तो यात्रियों का शरीर जड़त्व के कारण आगे बढ़ता रहता है। "
                        "सीटबेल्ट इसी जड़त्वीय गति का विरोध करने के लिए बल लगाती है। "
                        "स्क्रीन पर दिए गए वेक्टर आरेख में देखिए कि जब घर्षण बल और ड्राइविंग बल संतुलित होते हैं, तो गति स्थिर रहती है।"
                    ),
                    "hinglish": (
                        "Welcome! Newton ke First Law ke practical application ko samajhte hain. "
                        "Formula ke according, jab Net External Force zero hoti hai, acceleration zero hota hai yaani speed constant rehti hai. "
                        "Automotive engineering mein seatbelts aur airbags inertia ke principle par kaam karte hain. "
                        "Jab car brake lagati hai, inertia ki wajah se body forward move karti hai jab tak seatbelt opposite force na lagaye. "
                        "Chalkboard par balanced force vectors ko observe kijiye!"
                    )
                }

        # ----------------- SECOND LAW / F=MA -----------------
        elif "second law" in title_lower or "m*a" in title_lower or "f=ma" in title_lower:
            if level == "basic":
                return {
                    "en": (
                        "Now, let's explore Newton's Second Law with an easy grocery shopping example! "
                        "Imagine pushing an empty shopping cart versus a cart completely loaded with heavy cement bags. "
                        "If you give both carts the exact same gentle push, the empty cart zooms forward immediately, while the heavy cart barely budges! "
                        "Why? Because more mass means you need a much bigger push to get it moving. "
                        "The golden rule is: Force equals mass times acceleration. Push harder, and it speeds up faster; add more weight, and it gets harder to push. "
                        "Look at the simple formula breakdown on your screen!"
                    ),
                    "hi": (
                        "अब न्यूटन के दूसरे नियम को एक आसान बाज़ार की ट्रॉली के उदाहरण से समझते हैं! "
                        "सोचिए, एक खाली ट्रॉली को धक्का देना और ईंटों से भरी भारी ट्रॉली को धक्का देना। "
                        "उतने ही ज़ोर के धक्के से खाली ट्रॉली तेज़ी से भागेगी, जबकि भारी ट्रॉली बहुत धीमी चलेगी! "
                        "क्योंकि किसी वस्तु का वज़न जितना ज़्यादा होगा, उसे चलाने के लिए उतना ही ज़्यादा बल चाहिए। "
                        "सरल नियम है: बल बराबर द्रव्यमान गुणा त्वरण (F = m × a)। "
                        "ज़्यादा ज़ोर से धक्का देंगे तो रफ़्तार तेज़ी से बढ़ेगी। स्क्रीन पर इस आसान समीकरण को देखिए!"
                    ),
                    "hinglish": (
                        "Ab aate hain Newton ke Second Law par ek super easy shopping cart example ke saath! "
                        "Ek empty cart ko push karna versus bricks se bhari cart ko push karna. "
                        "Same force lagane par empty cart turant speed pakad leta hai, jabki heavy cart slow rehta hai. "
                        "Kyunki mass badhne par acceleration kam ho jata hai! "
                        "Simple rule yaad rakhiye: Force = Mass into Acceleration. "
                        "Screen par equation dekhiye aur aage badhiye!"
                    )
                }
            elif level == "hard":
                return {
                    "en": (
                        "In this advanced derivation of Newton's Second Law, we analyze the generalized differential formulation: Force equals the time derivative of linear momentum, dP over dt. "
                        "When mass varies continuously over time, such as in the Tsiolkovsky rocket equation, the standard F=ma is insufficient. "
                        "The full vector expansion yields: F_net equals m times dv/dt plus v_exhaust times dm/dt. "
                        "Furthermore, in continuum mechanics, this generalizes to Cauchy's equation of motion using the stress tensor. "
                        "Notice on the chalkboard how integrating the differential force over time gives the impulse-momentum theorem, and examine the state-space trajectory."
                    ),
                    "hi": (
                        "न्यूटन के द्वितीय नियम के उच्चस्तरीय गणितीय विश्लेषण में आपका स्वागत है। "
                        "सामान्य रूप से बल संवेग में परिवर्तन की समय दर है: F = dp/dt। "
                        "परिवर्तनशील द्रव्यमान वाले तंत्रों में, जैसे रॉकेट प्रणोदन में, F = ma पर्याप्त नहीं होता। "
                        "वहाँ पूर्ण समीकरण F_net = m(dv/dt) + v(dm/dt) का उपयोग किया जाता है। "
                        "ब्लैकबोर्ड पर दिए गए अवकल समीकरण और आवेग-संवेग प्रमेय की व्युत्पत्ति का बारीकी से अध्ययन करें।"
                    ),
                    "hinglish": (
                        "Newton's Second Law ke advanced mathematical treatment mein hum generalized differential form F = dp/dt analyze karte hain. "
                        "Jab system ka mass constant nahi hota, jaise space rocket fuel burn hone par, standard F=ma fail ho jata hai. "
                        "Full equation F_net = m*(dv/dt) + v_rel*(dm/dt) use hoti hai jisse Tsiolkovsky rocket equation derive hoti hai. "
                        "Chalkboard par calculus derivations aur impulse-momentum integrals ko dekhiye."
                    )
                }
            else: # medium (practical)
                return {
                    "en": (
                        "Welcome to the practical calculation session of Newton's Second Law: F equals m times a. "
                        "This law allows engineers to calculate exact forces and accelerations in machinery, vehicles, and structures. "
                        "For instance, if a 1,000 kilogram electric vehicle accelerates from rest at 3 meters per second squared, the motors must deliver exactly 3,000 Newtons of net horizontal thrust. "
                        "Remember the SI unit definition: One Newton is the force required to accelerate one kilogram at one meter per second squared. "
                        "Check out the step-by-step numerical calculation on your chalkboard!"
                    ),
                    "hi": (
                        "न्यूटन के दूसरे नियम की व्यावहारिक गणना में आपका स्वागत है: F = m × a। "
                        "यह नियम हमें मशीनों और वाहनों में लगने वाले वास्तविक बल की सटीक गणना करने की क्षमता देता है। "
                        "उदाहरण के लिए, 1,000 किलोग्राम की इलेक्ट्रिक कार को 3 मीटर प्रति सेकंड स्क्वायर के त्वरण से चलाने के लिए मोटर को 3,000 न्यूटन का बल उत्पन्न करना होगा। "
                        "याद रखें: एक न्यूटन वह बल है जो 1 किलोग्राम द्रव्यमान को 1 मीटर प्रति सेकंड स्क्वायर का त्वरण दे सके। "
                        "ब्लैकबोर्ड पर दिए गए व्यावहारिक गणना चरणों को ध्यान से देखिए!"
                    ),
                    "hinglish": (
                        "Welcome! Newton ke Second Law ki practical engineering calculations samajhte hain. "
                        "Formula: F = m * a yaani Acceleration a = F_net / m. "
                        "Example: Agar 1000 kg ki car ko 3 m/s² accelerate karna hai, toh engine ko exactly 3000 Newtons net thrust produce karna hoga. "
                        "1 Newton = 1 kg multiplied by m/s². "
                        "Chalkboard par step-by-step numbers dekhiye!"
                    )
                }

        # ----------------- FREE FALL IN VACUUM -----------------
        elif "free fall" in title_lower or "vacuum" in title_lower:
            if level == "basic":
                return {
                    "en": (
                        "Here is one of the most exciting science mysteries: "
                        "If you drop a heavy bowling ball and a light bird feather together, which hits the ground first? "
                        "In normal air, the feather floats down slowly because air pushes up against it. "
                        "But inside a vacuum tube with zero air, both fall at the exact same speed and touch down at the exact same instant! "
                        "Why? Because even though Earth pulls 10 times harder on the bowling ball, "
                        "the bowling ball is also 10 times heavier to move! The extra gravity and extra heaviness cancel each other out completely! "
                        "Watch the side-by-side animation on your screen!"
                    ),
                    "hi": (
                        "विज्ञान का एक बहुत ही रोचक सवाल: अगर 10 किलो के भारी पत्थर और एक हल्के पंख को एक साथ गिराएँ, तो पहले कौन गिरेगा? "
                        "हवा में पंख धीरे-धीरे तैरते हुए गिरता है क्योंकि हवा उसे रोकती है। "
                        "लेकिन निर्वात (वैक्यूम) में, जहाँ कोई हवा नहीं है, पत्थर और पंख बिल्कुल एक साथ ज़मीन छूते हैं! "
                        "ऐसा क्यों? क्योंकि पृथ्वी पत्थर को 10 गुना ज़्यादा बल से खींचती है, तो पत्थर को हिलाने के लिए 10 गुना ज़्यादा वज़न भी होता है! "
                        "दोनों प्रभाव आपस में कट जाते हैं, और दोनों 9.8 मीटर प्रति सेकंड स्क्वायर की एक समान गति से गिरते हैं। "
                        "स्क्रीन पर सिमुलेशन को देखिए!"
                    ),
                    "hinglish": (
                        "Yeh science ka sabse famous puzzle hai: Bowling ball aur light feather mein se pehle kaun girega? "
                        "Normal air mein feather float karta hai air resistance ki wajah se. "
                        "Lekin vacuum chamber mein jahan air bilkul nahi hai, dono exactly same second par neeche girenge! "
                        "Reason simple hai: Bowling ball par gravitational pull 10x zyada hai, toh uska mass bhi 10x inertia deta hai! "
                        "Dono effects perfectly cancel ho jaate hain aur acceleration dono ke liye same rehta hai. "
                        "Screen par vacuum visual dekhiye!"
                    )
                }
            elif level == "hard":
                return {
                    "en": (
                        "In this rigorous examination of Free Fall, we explore Einstein's Weak Equivalence Principle and geodesic trajectory in curved spacetime. "
                        "Newtonian mechanics demonstrates that gravitational mass m_g and inertial mass m_i cancel identically: m_i times a equals m_g times g, yielding invariant acceleration g. "
                        "However, modern experiments using torsion balances confirm m_i equals m_g to one part in 10 to the 15th power! "
                        "In General Relativity, free fall is not acceleration under a force, but inertial motion along a geodesic in pseudo-Riemannian spacetime, where proper acceleration measured by an accelerometer is strictly zero. "
                        "Examine the geodesic equation on the chalkboard and compare the relativistic vacuum trajectory against terminal velocity limits."
                    ),
                    "hi": (
                        "मुक्त पतन (Free Fall) के उच्च सैद्धांतिक विश्लेषण में हम आइंस्टीन के समतुल्यता सिद्धांत (Equivalence Principle) का अध्ययन करते हैं। "
                        "न्यूटनियन यांत्रिकी में गुरुत्वीय द्रव्यमान m_g और जड़त्वीय द्रव्यमान m_i का सटीक निरसन होता है: a = (m_g / m_i) * g = g। "
                        "आधुनिक सामान्य आपेक्षिकता सिद्धांत (General Relativity) में मुक्त पतन कोई बाह्य बल नहीं, बल्कि वक्र समष्टि-समय (Curved Spacetime) में जियोडेसिक गति है। "
                        "जहाँ किसी मुक्त गिरते कण का उचित त्वरण (Proper acceleration) शून्य होता है। "
                        "स्क्रीन पर दिए गए जियोडेसिक समीकरणों और सैद्धांतिक व्युत्पत्ति को समझिए।"
                    ),
                    "hinglish": (
                        "Free Fall ke rigorous breakdown mein hum Einstein ke Weak Equivalence Principle ko analyze karte hain. "
                        "Newtonian view mein inertial mass m_i aur gravitational mass m_g mathematically cancel ho jaate hain: a = (m_g/m_i)*g = g. "
                        "Lekin General Relativity ke prospective se, free fall koi downward force nahi hai, balki curved spacetime mein geodesic motion hai jahan proper acceleration strictly zero hoti hai. "
                        "Chalkboard par geodesic metric equations aur terminal drag dynamics ko review kijiye."
                    )
                }
            else: # medium (practical)
                return {
                    "en": (
                        "Welcome to our practical analysis of Free Fall and Aerodynamic Drag. "
                        "In a pure vacuum, the downward acceleration of all objects near Earth's surface is constant: g equals 9.81 meters per second squared. "
                        "However, in real-world atmospheric conditions, falling bodies experience hydrodynamic drag proportional to velocity squared: F_drag equals one-half rho v squared C_d A. "
                        "When drag force equals gravitational weight, net force becomes zero, and the falling object reaches constant terminal velocity. "
                        "Observe the velocity-time comparison curve on your screen: vacuum free fall versus atmospheric descent."
                    ),
                    "hi": (
                        "मुक्त पतन और वायुमंडलीय घर्षण के व्यावहारिक अध्ययन में आपका स्वागत है। "
                        "निर्वात में पृथ्वी की सतह के पास सभी वस्तुओं का नीचे की ओर त्वरण स्थिर रहता है: g = 9.81 मीटर प्रति सेकंड स्क्वायर। "
                        "परंतु वास्तविक वायुमंडल में हवा का खिंचाव गति के वर्ग के अनुपात में बढ़ता है। "
                        "जब वायु का घर्षण बल वस्तु के भार के बराबर हो जाता है, तो कुल बल शून्य हो जाता है और वस्तु अपनी टर्मिनल वेलोसिटी (सीमांत वेग) पर पहुँच जाती है। "
                        "स्क्रीन पर निर्वात और वायुमंडलीय गति के तुलनात्मक ग्राफ़ को देखिए।"
                    ),
                    "hinglish": (
                        "Welcome! Free Fall aur Terminal Velocity ke practical differences ko samajhte hain. "
                        "Vacuum mein har object g = 9.81 m/s² constant rate se accelerate hota hai. "
                        "Lekin real world atmosphere mein aerodynamic drag speed ke square ke sath badhta hai. "
                        "Jab air drag weight ke equal ho jata hai, net force zero ho kar object constant Terminal Velocity attain kar leta hai. "
                        "Chalkboard par numerical comparison aur drag formulas check kijiye!"
                    )
                }

        # ----------------- THIRD LAW / ACTION-REACTION -----------------
        else:
            if level == "basic":
                return {
                    "en": (
                        "Finally, let's understand Newton's Third Law: Action and Reaction! "
                        "For every action, there is always an equal and opposite reaction. "
                        "When you blow up a party balloon and let it go without tying it, air rushes downward, and the balloon zooms upward! "
                        "Or when you jump off a skateboard, your feet push the board backward, and the board pushes you forward! "
                        "The most important rule: Action and reaction forces act on two DIFFERENT objects, which is why they never cancel each other out! "
                        "Check out the interactive diagram on your screen!"
                    ),
                    "hi": (
                        "अंत में, न्यूटन के तीसरे नियम को समझते हैं: क्रिया और प्रतिक्रिया का नियम! "
                        "प्रत्येक क्रिया के बराबर और विपरीत दिशा में एक प्रतिक्रिया होती है। "
                        "जब आप एक गुब्बारे में हवा भरकर छोड़ते हैं, तो हवा नीचे निकलती है और गुब्बारा ऊपर भागता है! "
                        "या जब आप नाव से किनारे पर कूदते हैं, तो आपके पैर नाव को पीछे धकेलते हैं और नाव आपको आगे! "
                        "सबसे मुख्य बात याद रखिए: क्रिया और प्रतिक्रिया दो अलग-अलग वस्तुओं पर लगती हैं, इसीलिए वे एक-दूसरे को काटकर शून्य नहीं करतीं! "
                        "स्क्रीन पर बने इस चित्र को देखिए!"
                    ),
                    "hinglish": (
                        "Newton ke Third Law ko ekdum practical fun examples se samjhte hain: Action and Reaction! "
                        "Har action ka equal aur opposite reaction hota hai. "
                        "Jaise inflated balloon ko chhodne par air peeche nikalti hai aur balloon aage भागता hai! "
                        "Sabse important rule: Action aur reaction do alag-alag objects par lagte hain, isliye woh kabhi cancel nahi hote! "
                        "Screen par vector animation dekhiye!"
                    )
                }
            elif level == "hard":
                return {
                    "en": (
                        "In this rigorous advanced session on Newton's Third Law, we examine Momentum Conservation in relativistic and field-theoretic contexts. "
                        "In electrodynamics, instantaneous Newton's Third Law appears violated when two separated charges accelerate, because electromagnetic fields themselves carry momentum represented by the Poynting vector integral. "
                        "The generalized conservation law states that mechanical momentum plus electromagnetic field momentum is strictly conserved across all Lorentz frames. "
                        "Furthermore, in quantum field theory, particle interactions are represented as exchanges of gauge bosons satisfying four-momentum conservation at every Feynman vertex. "
                        "Analyze the field-theoretic vector derivations and conservation tensor on the chalkboard."
                    ),
                    "hi": (
                        "न्यूटन के तृतीय नियम के उच्च सैद्धांतिक विश्लेषण में हम आपेक्षिकीय और विद्युतचुंबकीय क्षेत्रों में संवेग संरक्षण का अध्ययन करते हैं। "
                        "विद्युतगतिकी में जब दो त्वरित आवेश अंतःक्रिया करते हैं, तो न्यूटन का तीसरा नियम तात्कालिक रूप से भंग प्रतीत होता है क्योंकि विद्युतचुंबकीय क्षेत्र स्वयं संवेग वहन करता है (Poynting Vector)। "
                        "कुल यांत्रिक संवेग और क्षेत्र संवेग का योगफल हमेशा संरक्षित रहता है। "
                        "क्वांटम यांत्रिकी में यह प्रत्येक शीर्ष पर चार-संवेग (Four-momentum) संरक्षण द्वारा व्यक्त होता है। "
                        "ब्लैकबोर्ड पर दिए गए उन्नत फील्ड-थ्योरी आरेख और टेंसर समीकरणों को समझिए।"
                    ),
                    "hinglish": (
                        "Newton's Third Law ke advanced study mein hum Field Theory aur Relativistic Momentum Conservation examine karte hain. "
                        "Electrodynamics mein Newton's Third Law instantaneous contact par depend nahi karta kyunki fields khud momentum carry karti hain via Poynting vector. "
                        "System ka total mechanical momentum plus electromagnetic field momentum universally conserved rehta hai across all Lorentz frames. "
                        "Chalkboard par field tensor derivations aur four-momentum vectors ko observe kijiye."
                    )
                }
            else: # medium (practical)
                return {
                    "en": (
                        "Welcome to our engineering session on Newton's Third Law: Action and Reaction Pairs. "
                        "This principle governs aerospace rocket propulsion, jet turbine mechanics, and structural load analysis. "
                        "A rocket engine produces thrust by ejecting high-velocity combustion gases downward with massive force; in reaction, the expelled gas exerts an identical upward thrust on the combustion chamber. "
                        "Always identify the two distinct interacting bodies: Force of A on B equals minus Force of B on A. "
                        "Observe the thrust and reaction vectors on your screen with real aerospace specifications!"
                    ),
                    "hi": (
                        "न्यूटन के तीसरे नियम के इंजीनियरिंग अनुप्रयोगों में आपका स्वागत है। "
                        "यह सिद्धांत रॉकेट प्रणोदन, जेट इंजनों और संरचनात्मक भार विश्लेषण की आधारशिला है। "
                        "रॉकेट का इंजन अत्यधिक वेग से गैसों को नीचे की ओर धकेलता है; प्रतिक्रिया स्वरूप वे गैसें रॉकेट के दहन कक्ष पर उतना ही बल ऊपर की ओर लगाती हैं। "
                        "हमेशा दो अलग वस्तुओं की पहचान करें: F_AB = - F_BA। "
                        "स्क्रीन पर रॉकेट थ्रस्ट और प्रतिक्रिया वैक्टर को व्यावहारिक आंकड़ों के साथ देखिए!"
                    ),
                    "hinglish": (
                        "Welcome! Newton ke Third Law ke aerospace engineering applications ko samajhte hain. "
                        "Rockets aur jet turbines isi principle par fly karte hain: engine combustion gases ko downward eject karta hai, aur reacting gases rocket body ko upward thrust provide karti hain. "
                        "Formula: F_AB = - F_BA. Action force ek body par aur reaction force doosri body par lagti hai. "
                        "Chalkboard par aerospace thrust vectors aur practical numbers notice kijiye!"
                    )
                }

    # =========================================================================
    # 2. LEVEL-SPECIFIC VISUAL DATA GENERATOR
    # =========================================================================
    @staticmethod
    def _generate_visual_data(cid: str, visual_type: str, title: str, language: str, level: str = "basic") -> Dict[str, Any]:
        title_lower = title.lower()

        if visual_type == "SIMULATION_DIAGRAM":
            if level == "basic":
                return {
                    "type": "SIMULATION_DIAGRAM",
                    "title": f"{title} (सरल मॉडल)",
                    "explanation_mode": "basic",
                    "canvas_mode": "free_body_physics",
                    "vectors": [
                        {"label": "Gentle Push →", "direction": "right", "color": "#38bdf8", "magnitude": 60},
                        {"label": "← Ground Friction", "direction": "left", "color": "#f43f5e", "magnitude": 20},
                    ],
                    "simulation_params": {
                        "mass": 5,
                        "net_force": 40,
                        "acceleration": "8 m/s²",
                        "law": "Push harder → Moves faster!"
                    },
                    "key_takeaway": "If your push is stronger than friction, the object speeds up forward!"
                }
            elif level == "hard":
                return {
                    "type": "SIMULATION_DIAGRAM",
                    "title": f"{title} (Rigorous Tensor Free-Body)",
                    "explanation_mode": "hard",
                    "canvas_mode": "free_body_physics",
                    "vectors": [
                        {"label": "F_applied (100 N)", "direction": "right", "color": "#38bdf8", "magnitude": 100},
                        {"label": "F_drag (-b·v)", "direction": "left", "color": "#f43f5e", "magnitude": 25},
                        {"label": "Normal Force N = mg", "direction": "up", "color": "#10b981", "magnitude": 75},
                        {"label": "Gravity m·g", "direction": "down", "color": "#f59e0b", "magnitude": 75},
                        {"label": "Pseudo Force (-m·a_frame)", "direction": "left", "color": "#ec4899", "magnitude": 15}
                    ],
                    "simulation_params": {
                        "mass": 10.0,
                        "net_force": 60.0,
                        "acceleration": "6.0 m/s² (Non-Inertial Corrected)",
                        "law": "m·(d²r/dt²) = ΣF_ext - m·a_frame - 2m(ω × v)"
                    },
                    "key_takeaway": "Rigorous non-inertial formulation accounts for fictitious inertial forces and coordinate rotations."
                }
            else: # medium
                return {
                    "type": "SIMULATION_DIAGRAM",
                    "title": f"{title} (Practical Engineering Vectors)",
                    "explanation_mode": "medium",
                    "canvas_mode": "free_body_physics",
                    "vectors": [
                        {"label": "F_thrust = 100 N", "direction": "right", "color": "#38bdf8", "magnitude": 100},
                        {"label": "F_friction = 25 N", "direction": "left", "color": "#f43f5e", "magnitude": 25},
                        {"label": "Normal N = 75 N", "direction": "up", "color": "#10b981", "magnitude": 75},
                        {"label": "Weight W = 75 N", "direction": "down", "color": "#f59e0b", "magnitude": 75}
                    ],
                    "simulation_params": {
                        "mass": 10,
                        "net_force": 75,
                        "acceleration": "7.5 m/s²",
                        "law": "Newton's Second Law: a = F_net / m = 75N / 10kg"
                    },
                    "key_takeaway": "Net horizontal force of 75 N causes a steady 7.5 m/s² forward acceleration."
                }

        elif visual_type == "EQUATION":
            if level == "basic":
                return {
                    "type": "EQUATION",
                    "title": f"{title} (सरल समीकरण)",
                    "explanation_mode": "basic",
                    "latex_main": r"\text{Force} = \text{Mass} \times \text{Acceleration}",
                    "steps": [
                        {"step": 1, "formula": r"\text{Push Harder} \implies \text{Faster Acceleration}", "explanation": "More push means the object speeds up much quicker"},
                        {"step": 2, "formula": r"\text{Heavier Object} \implies \text{Needs Bigger Push}", "explanation": "A heavy cart needs more force than an empty cart"},
                        {"step": 3, "formula": r"F = m \times a", "explanation": "Simple memory rule: Force = Mass × Acceleration"}
                    ],
                    "key_takeaway": "Light objects speed up easily; heavy objects resist moving!"
                }
            elif level == "hard":
                return {
                    "type": "EQUATION",
                    "title": f"{title} (Calculus & Tensor Derivation)",
                    "explanation_mode": "hard",
                    "latex_main": r"\vec{F}_{\text{net}} = \frac{d\vec{p}}{dt} = m\frac{d\vec{v}}{dt} + \vec{v}\frac{dm}{dt}",
                    "steps": [
                        {"step": 1, "formula": r"\vec{p} = m\vec{v} \implies \vec{F} = \frac{d(m\vec{v})}{dt}", "explanation": "General definition of force as momentum rate of change"},
                        {"step": 2, "formula": r"\vec{F}_{\text{net}} = m \ddot{\vec{r}} + \dot{m}\dot{\vec{r}}", "explanation": "Leibniz product rule applied to variable-mass systems"},
                        {"step": 3, "formula": r"m\ddot{x} + \gamma \dot{x} + \omega_0^2 x = F_{\text{ext}}(t)", "explanation": "Second-order differential equation of motion with drag"},
                        {"step": 4, "formula": r"\Delta P_{\mu} = \int \mathcal{F}_{\mu} \, d\tau", "explanation": "Relativistic four-force formulation in Minkowski space"}
                    ],
                    "key_takeaway": "Force is fundamentally the time-derivative of momentum flux; F=ma is valid strictly when dm/dt = 0."
                }
            else: # medium
                return {
                    "type": "EQUATION",
                    "title": f"{title} (Practical Calculation Steps)",
                    "explanation_mode": "medium",
                    "latex_main": r"F_{\text{net}} = m \cdot a \quad \left(a = \frac{F_{\text{net}}}{m}\right)",
                    "steps": [
                        {"step": 1, "formula": r"F_{\text{net}} = m \cdot a", "explanation": "Net external force equals mass times acceleration"},
                        {"step": 2, "formula": r"a = \frac{F_{\text{net}}}{m} = \frac{75\text{ N}}{10\text{ kg}} = 7.5\text{ m/s}^2", "explanation": "Calculating acceleration with 75 N net force on 10 kg mass"},
                        {"step": 3, "formula": r"1\text{ N} = 1\text{ kg} \cdot \text{m/s}^2", "explanation": "SI unit definition of force in standard metric units"}
                    ],
                    "key_takeaway": "Acceleration is directly proportional to net force and inversely proportional to mass."
                }

        elif visual_type == "FLOWCHART_PROCESS":
            if level == "basic":
                return {
                    "type": "FLOWCHART_PROCESS",
                    "title": f"{title} (सरल प्रक्रिया)",
                    "explanation_mode": "basic",
                    "chemical_equation": r"\text{Sunlight} + \text{Water} + \text{Air} \longrightarrow \text{Plant Food} + \text{Oxygen}",
                    "nodes": [
                        {"id": 1, "label": "1. Sunlight Caught", "detail": "Green leaves soak up warm sunlight"},
                        {"id": 2, "label": "2. Water from Roots", "detail": "Water travels up from the soil"},
                        {"id": 3, "label": "3. Sweet Sugar Made", "detail": "Plant makes glucose for energy"},
                        {"id": 4, "label": "4. Fresh Air Released", "detail": "Clean oxygen gas given back to us"}
                    ],
                    "key_takeaway": "Plants use sunlight like a kitchen factory to turn water into sweet energy and clean air!"
                }
            elif level == "hard":
                return {
                    "type": "FLOWCHART_PROCESS",
                    "title": f"{title} (Biochemical Pathway & Electron Transport)",
                    "explanation_mode": "hard",
                    "chemical_equation": r"6\text{CO}_2 + 6\text{H}_2\text{O} + h\nu \xrightarrow{\text{RuBisCO}} \text{C}_6\text{H}_{12}\text{O}_6 + 6\text{O}_2 \quad (\Delta G^\circ = +2870\text{ kJ/mol})",
                    "nodes": [
                        {"id": 1, "label": "Photosystem II (P680)", "detail": "Photolysis of H₂O generates proton gradient across thylakoid lumen"},
                        {"id": 2, "label": "Cytochrome b6f Complex", "detail": "Plastoquinone PQ shuttles electrons; chemiosmotic ATP synthase phosphorylation"},
                        {"id": 3, "label": "Photosystem I (P700)", "detail": "Ferredoxin-NADP+ reductase synthesizes NADPH cofactor"},
                        {"id": 4, "label": "Calvin-Benson-Bassham Cycle", "detail": "Ribulose-1,5-bisphosphate carboxylase oxygenase fixes CO₂ into 3-PGA"}
                    ],
                    "key_takeaway": "Electrons from H₂O photolysis drive non-cyclic photophosphorylation, storing potential energy in ATP and NADPH."
                }
            else: # medium
                return {
                    "type": "FLOWCHART_PROCESS",
                    "title": f"{title} (Standard Process Flow)",
                    "explanation_mode": "medium",
                    "chemical_equation": r"6\text{CO}_2 + 6\text{H}_2\text{O} + \text{Light} \longrightarrow \text{C}_6\text{H}_{12}\text{O}_6 + 6\text{O}_2",
                    "nodes": [
                        {"id": 1, "label": "1. Light Absorption", "detail": "Chlorophyll pigments absorb photons in thylakoid membranes"},
                        {"id": 2, "label": "2. Water Photolysis", "detail": "H₂O split into 2H+, electrons, and O₂ gas"},
                        {"id": 3, "label": "3. ATP Synthesis", "detail": "ATP & NADPH produced for energy transfer"},
                        {"id": 4, "label": "4. Glucose Synthesis", "detail": "CO₂ converted into glucose sugar in stroma"}
                    ],
                    "key_takeaway": "Oxygen gas comes entirely from splitting water molecules, driven by light energy."
                }

        else: # TIMELINE or CONCEPT_CARD
            if level == "basic":
                return {
                    "type": "TIMELINE",
                    "title": f"{title} (इतिहास एवं मुख्य खोजें)",
                    "explanation_mode": "basic",
                    "milestones": [
                        {"year": "350 BCE", "author": "Aristotle", "doctrine": "Thought everything stops unless constantly pushed"},
                        {"year": "1632 CE", "author": "Galileo Galilei", "doctrine": "Discovered that objects keep gliding if friction is removed"},
                        {"year": "1687 CE", "author": "Isaac Newton", "doctrine": "Wrote down the famous 3 Laws of Motion for everyone"}
                    ]
                }
            elif level == "hard":
                return {
                    "type": "TIMELINE",
                    "title": f"{title} (Epistemological & Theoretical Milestones)",
                    "explanation_mode": "hard",
                    "milestones": [
                        {"year": "1687 CE", "author": "Newton", "doctrine": "Principia Mathematica: Absolute Euclidean space and universal gravitation"},
                        {"year": "1788 CE", "author": "Lagrange", "doctrine": "Analytical Mechanics: Generalized coordinates and variational principles (δS = 0)"},
                        {"year": "1905 CE", "author": "Einstein", "doctrine": "Special Relativity: Invariance of c, spacetime metric, and four-momentum conservation"},
                        {"year": "1915 CE", "author": "General Relativity", "doctrine": "Weak Equivalence Principle: Gravitational mass equals inertial mass identically"}
                    ]
                }
            else: # medium
                return {
                    "type": "TIMELINE",
                    "title": f"{title} (Scientific Discovery Timeline)",
                    "explanation_mode": "medium",
                    "milestones": [
                        {"year": "350 BCE", "author": "Aristotle", "doctrine": "Believed continuous force is necessary for constant motion"},
                        {"year": "1632 CE", "author": "Galileo Galilei", "doctrine": "Disproved Aristotle using smooth inclined planes and inertia"},
                        {"year": "1687 CE", "author": "Isaac Newton", "doctrine": "Formalized Principia Mathematica with 3 fundamental motion laws"}
                    ]
                }

    # =========================================================================
    # 3. LEVEL-TAILORED CHECKPOINT QUESTIONS
    # =========================================================================
    @staticmethod
    def _get_level_checkpoint(cid: str, title: str, level: str, language: str, domain: str, default_cp: Any = None) -> Dict[str, Any]:
        title_lower = title.lower()

        # Newton's First Law / Inertia
        if "inertia" in title_lower or "galileo" in title_lower or "first law" in title_lower:
            if level == "basic":
                return {
                    "question": "यदि अंतरिक्ष में (जहाँ शून्य घर्षण है) किसी गेंद को फेंका जाए, तो क्या होगा?" if language == "hi" else "If you kick a ball in deep space with zero friction, what happens?",
                    "options": [
                        "वह हमेशा उसी गति से सीधी रेखा में चलती रहेगी" if language == "hi" else "It glides forward forever at constant speed in a straight line",
                        "कुछ दूर जाकर अपने आप रुक जाएगी" if language == "hi" else "It slows down and stops on its own after a while",
                        "वह तुरंत नीचे गिर जाएगी" if language == "hi" else "It immediately drops straight down"
                    ],
                    "correct_index": 0,
                    "explanation": "अंतरिक्ष में कोई घर्षण नहीं है, इसलिए जड़त्व (Inertia) के कारण गेंद बिना रुके उसी गति से चलती रहेगी।" if language == "hi" else "In frictionless space, Inertia keeps the object gliding at constant speed forever."
                }
            elif level == "hard":
                return {
                    "question": "त्वरित निर्देश तंत्र (Accelerating Frame) में न्यूटन का प्रथम नियम लागू करने के लिए किस पद का उपयोग आवश्यक है?" if language == "hi" else "In an accelerating reference frame, what mathematical correction is required for Newton's laws?",
                    "options": [
                        "छद्म बल जैसे कोरिओलिस और अपकेंद्रीय बल (-m*a_frame)" if language == "hi" else "Fictitious pseudo-forces: -m*a_frame and Coriolis acceleration",
                        "द्रव्यमान को शून्य मानना पड़ता है" if language == "hi" else "Setting particle mass to zero",
                        "केवल गुरुत्वाकर्षण बल को दोगुना करना" if language == "hi" else "Doubling the gravitational constant"
                    ],
                    "correct_index": 0,
                    "explanation": "अजड़त्वीय त्वरित तंत्रों में प्रेक्षक के त्वरण की भरपाई हेतु छद्म बल (-m*a_frame) जोड़ना पड़ता है।" if language == "hi" else "In non-inertial frames, pseudo-forces (-m*a_frame) must be introduced to preserve equations of motion."
                }
            else: # medium
                return {
                    "question": "60 किमी/घंटा की गति से चल रही कार में अचानक ब्रेक लगाने पर यात्री आगे क्यों झुकते हैं?" if language == "hi" else "Why do passengers lurch forward when a car cruising at 60 km/h suddenly brakes?",
                    "options": [
                        "जड़त्व के कारण उनका शरीर उसी 60 किमी/घंटा की गति से आगे बढ़ता रहता है" if language == "hi" else "Due to inertia, their body continues forward at 60 km/h until restrained",
                        "हवा का दबाव उन्हें आगे खींचता है" if language == "hi" else "Air pressure inside the car pulls them forward",
                        "कार का गुरुत्वाकर्षण बढ़ जाता है" if language == "hi" else "The car's gravity increases temporarily"
                    ],
                    "correct_index": 0,
                    "explanation": "शरीर के ऊपरी हिस्से पर कोई ब्रेक बल नहीं लगा, अतः जड़त्व ने उसे पूर्व गति में बनाए रखा।" if language == "hi" else "The body's inertia maintains initial velocity until external restraint force from seatbelt is applied."
                }

        # Second Law / F=ma
        elif "second law" in title_lower or "m*a" in title_lower or "f=ma" in title_lower:
            if level == "basic":
                return {
                    "question": "यदि आप एक खाली और एक भारी भरी हुई ट्रॉली को बराबर ज़ोर से धक्का दें, तो क्या होगा?" if language == "hi" else "If you push an empty cart and a heavy cart with the exact same push, what happens?",
                    "options": [
                        "खाली ट्रॉली बहुत तेज़ी से आगे भागेगी क्योंकि उसका द्रव्यमान कम है" if language == "hi" else "The empty cart accelerates much faster because it has less mass",
                        "भारी ट्रॉली ज़्यादा तेज़ भागेगी" if language == "hi" else "The heavy cart moves faster",
                        "दोनों बिल्कुल एक समान रफ़्तार से चलेंगी" if language == "hi" else "Both move at the identical speed"
                    ],
                    "correct_index": 0,
                    "explanation": "F = m * a: द्रव्यमान कम होने पर त्वरण ज़्यादा होता है।" if language == "hi" else "F = m * a: Lower mass produces greater acceleration for the same applied force."
                }
            elif level == "hard":
                return {
                    "question": "परिवर्तनशील द्रव्यमान तंत्र (जैसे रॉकेट प्रणोदन) में सही अवकल संबंध क्या है?" if language == "hi" else "For a variable-mass system like a launching rocket, what is the exact governing equation?",
                    "options": [
                        "F_net = m*(dv/dt) + v_rel*(dm/dt) (समय के साथ संवेग परिवर्तन)" if language == "hi" else "F_net = m*(dv/dt) + v_rel*(dm/dt) from dP/dt",
                        "F = m*a (द्रव्यमान परिवर्तन का कोई प्रभाव नहीं)" if language == "hi" else "F = m*a without mass change terms",
                        "F = dm/dt केवल" if language == "hi" else "F = dm/dt exclusively"
                    ],
                    "correct_index": 0,
                    "explanation": "चूँकि dm/dt != 0, बल संवेग के पूर्ण अवकलज d(mv)/dt से निर्धारित होता है।" if language == "hi" else "Because mass varies continuously, force must be derived from the full Leibniz product rule on momentum flux."
                }
            else: # medium
                return {
                    "question": "एक 10 kg की वस्तु पर 80 N का धक्का और 30 N का घर्षण लग रहा है। त्वरण (Acceleration) क्या होगा?" if language == "hi" else "A 10 kg object experiences an 80 N push and 30 N friction. What is its acceleration?",
                    "options": [
                        "5 m/s² (Net Force = 50 N, a = 50 / 10)" if language == "hi" else "5 m/s² (Net Force = 50 N, a = 50/10)",
                        "8 m/s² (80 / 10)" if language == "hi" else "8 m/s² (80 / 10)",
                        "11 m/s² (110 / 10)" if language == "hi" else "11 m/s² (110 / 10)"
                    ],
                    "correct_index": 0,
                    "explanation": "Net Force = 80 - 30 = 50 N. a = F_net / m = 50 / 10 = 5 m/s²." if language == "hi" else "Net Force = 80 - 30 = 50 N. a = F_net / m = 50 / 10 = 5 m/s²."
                }

        # Fallback to default or domain-level checkpoint
        if default_cp:
            return default_cp

        return {
            "question": f"What is the key takeaway of '{title}' at the {level.upper()} level?",
            "options": [
                f"Core foundational mechanism of {title}",
                "Opposite contradictory effect",
                "Unrelated phenomenon"
            ],
            "correct_index": 0,
            "explanation": f"The {level} mode emphasizes the core mechanics and properties of {title}."
        }

    # =========================================================================
    # 4. CUSTOM CONTENT GENERATOR (DOCS, UPLOADS, ARBITRARY TOPICS)
    # =========================================================================
    @staticmethod
    def _generate_custom_script(title: str, raw_text: str, focus: str, key_terms: List[str], language: str, level: str, domain: str) -> str:
        clean_sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', raw_text) if len(s.strip()) > 15]
        summary_points = " ".join(clean_sentences[:3]) if clean_sentences else (focus or title)
        terms_str = ", ".join(key_terms[:4]) if key_terms else "Core Principles"

        analogy_map = {
            "ai": "Think of reading a long paragraph: instead of memorizing every letter, your brain selectively pays attention to key matching keywords.",
            "physics": "Think of pushing a heavy shopping cart versus an empty one: greater mass inherently demands greater effort to accelerate.",
            "biology": "Think of a plant cell like a solar-powered kitchen factory, turning sunlight and water into sweet nutritious food.",
            "chemistry": "Think of atoms like tiny solar systems, where electrons orbit in neat stable shells around a nucleus.",
            "cs": "Think of organizing a deck of shuffled cards quickly by comparing two cards at a time.",
            "general": f"Think of {title} as building blocks working harmoniously together."
        }
        analogy = analogy_map.get(domain, f"Think of {title} step by step.")

        if language == "hi":
            if level == "basic":
                return f"नमस्ते! आज हम '{title}' को बहुत ही आसान और सरल तरीके से समझेंगे। {analogy} मुख्य बात यह है कि {focus or summary_points}। स्क्रीन पर दिए गए आसान चित्र को देखिए!"
            elif level == "hard":
                return f"गहन विश्लेषण में, '{title}' का सैद्धांतिक और गणितीय आधार {focus or summary_points} पर निर्भर करता है। यहाँ मुख्य तकनीकी घटक: {terms_str} हैं। स्क्रीन पर दिए गए फॉर्मूले और आर्किटेक्चरल डायग्राम को गहराई से समझिए।"
            else: # medium
                return f"नमस्ते! '{title}' के व्यावहारिक और प्रायोगिक कार्यप्रणाली को स्टेप-बाय-स्टेप समझते हैं। इसका मुख्य सिद्धांत {focus or summary_points} है, जहाँ {terms_str} आपस में जुड़े हैं।"

        elif language == "hinglish":
            if level == "basic":
                return f"Hello! Aaj hum '{title}' ko ekdum simple real-world example se samjhenge. {analogy} Iska main concept yeh hai ki {focus or summary_points}. Screen par realistic visual dekhiye!"
            elif level == "hard":
                return f"Deep-dive session: '{title}' ka advanced mathematical aur structural foundation {focus or summary_points} par based hai. Key parameters aur mechanisms: {terms_str}. Visualizer mein equations aur tensors notice kijiye."
            else: # medium
                return f"Hello everyone! '{title}' ke working mechanism ko step-by-step explore karte hain. Main principle hai: {focus or summary_points}. Important terms to master: {terms_str}."

        else: # en
            if level == "basic":
                return f"Hello! Let's understand '{title}' with a simple intuitive real-world analogy. {analogy} At its core: {focus or summary_points}. Check out the visual on your screen!"
            elif level == "hard":
                return f"In this rigorous advanced breakdown of '{title}', we examine the underlying theoretical mechanics: {focus or summary_points}. Key formal parameters include: {terms_str}. Examine the mathematical formulation on the chalkboard."
            else: # medium
                return f"Welcome! Let's explore the core practical mechanics of '{title}'. The primary principle is: {focus or summary_points}, driven by key mechanisms: {terms_str}."

    @staticmethod
    def _generate_custom_visual(title: str, raw_text: str, focus: str, key_terms: List[str], visual_type: str, domain: str, level: str) -> Dict[str, Any]:
        clean_sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', raw_text) if len(s.strip()) > 15]
        
        if level == "basic":
            bullets = [
                f"Intuitive concept: {focus or title}",
                "Everyday observation: Simple cause-and-effect relationship",
                "Practical rule: Easy to remember mental model"
            ]
            key_takeaway = f"Simple Rule: {focus or title} in everyday life."
        elif level == "hard":
            bullets = [
                f"Formal Theorem: {focus or title}",
                f"Governing Parameters: {', '.join(key_terms[:5]) if key_terms else 'Mathematical Invariants'}",
                "Boundary conditions & asymptotic behavior",
                "Differential formulation & state trajectory"
            ]
            key_takeaway = f"Theoretical Invariant: Rigorous boundary mechanics of {title}."
        else: # medium
            bullets = clean_sentences[:4] if len(clean_sentences) >= 2 else (
                [focus] if focus else [f"Core principle of {title}"]
            )
            if key_terms:
                bullets.append(f"Key Terms: {', '.join(key_terms[:4])}")
            key_takeaway = bullets[0] if bullets else f"Summary of {title}"

        example_map = {
            "ai": "Real-world application: Multi-head attention dynamically re-weighting word associations in natural language translations.",
            "physics": "Real-world application: Kinetic energy dissipation in aerospace deceleration heat shields.",
            "biology": "Real-world application: Photosynthetic photon absorption regulating cellular glucose synthesis in agricultural crops.",
            "chemistry": "Real-world application: Covalent valence electron sharing in high-efficiency solar battery electrolytes.",
            "cs": "Real-world application: Logarithmic binary search locating records in millisecond database queries.",
            "general": f"Practical application: Real-world deployment of {title} in modern systems."
        }
        example_text = example_map.get(domain, f"Practical application of {title}.")

        return {
            "type": "CONCEPT_CARD",
            "title": title,
            "detected_domain": domain,
            "explanation_mode": level,
            "summary": focus or (bullets[0] if bullets else title),
            "key_takeaway": key_takeaway,
            "bullets": bullets,
            "real_world_example": example_text,
            "key_terms": key_terms or ["Core Principle", "Application"]
        }

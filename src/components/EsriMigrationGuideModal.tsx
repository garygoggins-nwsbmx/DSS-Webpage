import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Code2, 
  Cpu, 
  ExternalLink, 
  Globe2, 
  Layers, 
  Terminal, 
  X, 
  Copy, 
  Check, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const EsriMigrationGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'custom-widget' | 'automation' | 'roadmap'>('comparison');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const widgetBoilerplate = `// ArcGIS Experience Builder Developer Edition
// Custom React Widget: client/your-extensions/widgets/nws-dss-portal/src/runtime/widget.tsx
import { React, AllWidgetProps, jsx } from 'jimu-core';
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis';

interface ExtraProps {
  defaultOffice: string;
}

export default class NwsDssPortalWidget extends React.PureComponent<AllWidgetProps<ExtraProps>, { activeOffice: string }> {
  constructor(props) {
    super(props);
    this.state = { activeOffice: this.props.config?.defaultOffice || 'BMX' };
  }

  // Experience Builder native integration with ArcGIS Maps SDK 4.x
  onActiveViewChange = (jmv: JimuMapView) => {
    if (jmv) {
      console.log('Connected to ArcGIS WebMap:', jmv.view.map.portalItem.id);
    }
  };

  render() {
    return (
      <div className="widget-nws-dss p-4 bg-slate-900 text-white rounded-2xl">
        <h3 className="text-lg font-bold">NWS Decision Support Portal ({this.state.activeOffice})</h3>
        {/* Integrate your React tabs, live api.weather.gov feeds, and radar switcher */}
        {this.props.useMapWidgetIds && this.props.useMapWidgetIds.length > 0 && (
          <JimuMapViewComponent
            useMapWidgetId={this.props.useMapWidgetIds[0]}
            onActiveViewChange={this.onActiveViewChange}
          />
        )}
      </div>
    );
  }
}`;

  const pythonAutomationScript = `# Python automation script using the ArcGIS API for Python (arcgis)
# Run via GitHub Actions, Jenkins, or cron to automate DSS Web Experiences
from arcgis.gis import GIS
import json

# 1. Authenticate to ArcGIS Online / Enterprise
gis = GIS("https://your-org.maps.arcgis.com", "gis_admin_username", "secret_api_key_or_password")

# 2. Reference Master DSS Experience Template
template_item = gis.content.get("MASTER_DSS_EXPERIENCE_ITEM_ID")
template_data = template_item.get_data()

# Offices to deploy
offices = [
    {"code": "BMX", "title": "NWS Birmingham DSS Portal", "lat": 33.347, "lon": -86.780},
    {"code": "HUN", "title": "NWS Huntsville DSS Portal", "lat": 34.724, "lon": -86.645},
    {"code": "MOB", "title": "NWS Mobile DSS Portal", "lat": 30.695, "lon": -88.043},
    {"code": "TAE", "title": "NWS Tallahassee DSS Portal", "lat": 30.438, "lon": -84.280}
]

for office in offices:
    # 3. Clone and customize JSON configuration
    custom_data = json.loads(json.dumps(template_data)) # deep copy
    # Inject office-specific defaults, bounding box, or feed URL
    custom_data["attributes"]["defaultOffice"] = office["code"]

    # 4. Create or update Web Experience Item
    item_props = {
        "title": office["title"],
        "type": "Web Experience",
        "tags": ["NWS", "DSS", "NOAA", office["code"], "Emergency Management"],
        "snippet": f"Statewide Decision Support Services portal for NWS {office['code']}"
    }
    
    new_experience = gis.content.add(item_properties=item_props, data=json.dumps(custom_data))
    
    # 5. Make publicly accessible with ONE click
    new_experience.share(everyone=True)
    print(f"✅ Published public URL: {new_experience.url}")
`;

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-sky-900 text-white px-6 py-5 flex items-center justify-between border-b border-sky-400/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-sky-400/20 text-sky-300 px-2 py-0.5 rounded border border-sky-400/30">
                  ESRI Platform Transition Advisory
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight m-0">
                ESRI Architecture & Automation Strategy
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Experience Builder vs. ArcGIS Hub
          </button>
          <button
            onClick={() => setActiveTab('custom-widget')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'custom-widget'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> Custom React Widget SDK
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'automation'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> Automation (Python / REST)
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'roadmap'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> 2-Year Sunset Roadmap
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 flex-1">
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-sky-50 border border-sky-200 p-5 rounded-2xl">
                <div className="flex items-center gap-2 text-sky-900 font-extrabold text-sm mb-1">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  Direct Verdict: Which solution is best for you?
                </div>
                <p className="text-xs sm:text-sm text-sky-950 leading-relaxed m-0">
                  <strong>ArcGIS Experience Builder (specifically Developer Edition)</strong> is by far the superior choice for this project. 
                  Experience Builder is built natively on <strong>React 18+ and TypeScript</strong> with full custom widget extension capabilities (`jimu-core`). 
                  ArcGIS Hub is designed for high-level open data engagement with rigid pre-built cards; custom JavaScript inside Hub is heavily restricted or sandboxed for security. 
                  Below is the detailed comparison.
                </p>
              </div>

              {/* Comparison Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-900 text-white uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="p-3">Capability</th>
                      <th className="p-3 bg-sky-900 text-sky-200">ArcGIS Experience Builder</th>
                      <th className="p-3">ArcGIS Hub</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">Complex Custom Widgets</td>
                      <td className="p-3 bg-sky-50/50 font-semibold text-sky-950">
                        ⭐ <strong>Full Custom TypeScript / React widgets</strong> via Experience Builder Developer Edition (`jimu-ui`, `jimu-core`). 100% control over CSS, REST calls, state, and UI.
                      </td>
                      <td className="p-3 text-slate-600">
                        ❌ <strong>Extremely limited.</strong> Arbitrary scripts are stripped or sandboxed. Only standard cards (Text, Image, Gallery, Iframe embed).
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">Non-ESRI Dynamic APIs (NWS, ACIS, NOAA STAR)</td>
                      <td className="p-3 bg-sky-50/50 font-semibold text-sky-950">
                        ✅ Native `fetch()` calls to `api.weather.gov`, ACIS climate records, NEXRAD radar loops, and teleprinter bulletins.
                      </td>
                      <td className="p-3 text-slate-600">
                        ⚠️ Must be wrapped inside an iframe or statically pre-rendered before embed.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">Public Long-Term Accessibility</td>
                      <td className="p-3 bg-sky-50/50 font-semibold text-sky-950">
                        ✅ Can be made <strong>publicly accessible with 1 click</strong> via ArcGIS Online or hosted as a static production build on your cloud CDN with zero login required.
                      </td>
                      <td className="p-3 text-slate-600">
                        ✅ Public by design (Hub sites are public websites linked to AGOL items).
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">Automation of Webpage Creation</td>
                      <td className="p-3 bg-sky-50/50 font-semibold text-sky-950">
                        ✅ Web Experience items are JSON documents. Fully automatable with <strong>ArcGIS API for Python (`arcgis.gis`)</strong> or CI/CD pipelines.
                      </td>
                      <td className="p-3 text-slate-600">
                        ⚠️ Hub sites can be created via Python API, but layout customization is cumbersome and template-dependent.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">Ideal Architecture Pattern</td>
                      <td className="p-3 bg-sky-50/50 font-semibold text-sky-950" colSpan={2}>
                        💡 <strong>The Recommended Enterprise Blend:</strong> Build the high-performance Decision Support application in <strong>ArcGIS Experience Builder</strong>. If your organization operates a broader community portal in ArcGIS Hub, embed the Experience Builder app directly via a Hub Application Card!
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'custom-widget' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 m-0">
                    Experience Builder Developer Edition: Custom React Widget
                  </h3>
                  <p className="text-xs text-slate-500 m-0">
                    Experience Builder Developer Edition allows you to copy and paste standard React code directly into a widget extension.
                  </p>
                </div>
                <button
                  onClick={() => copyCode('widget', widgetBoilerplate)}
                  className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSnippet === 'widget' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSnippet === 'widget' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              <div className="bg-slate-950 rounded-2xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[380px] border border-slate-800">
                <pre>{widgetBoilerplate}</pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">1. manifest.json</span>
                  <span className="text-slate-600">Declares widget metadata, author, dependencies, and settings properties.</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">2. widget.tsx</span>
                  <span className="text-slate-600">Standard React component handling NOAA API data fetching, tabs, radar loops, and UI.</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">3. setting.tsx</span>
                  <span className="text-slate-600">Optional configuration panel in the Experience Builder builder interface to pick offices (BMX, HUN, MOB).</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'automation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 m-0">
                    Automating Page Generation via ArcGIS API for Python
                  </h3>
                  <p className="text-xs text-slate-500 m-0">
                    Because Web Experiences in ArcGIS Online are stored as JSON specifications, you can automate creating multiple office instances in seconds.
                  </p>
                </div>
                <button
                  onClick={() => copyCode('python', pythonAutomationScript)}
                  className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSnippet === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSnippet === 'python' ? 'Copied!' : 'Copy Python'}
                </button>
              </div>

              <div className="bg-slate-950 rounded-2xl p-4 font-mono text-xs text-sky-300 overflow-x-auto max-h-[380px] border border-slate-800">
                <pre>{pythonAutomationScript}</pre>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-950">
                <strong className="block mb-1">💡 Automation Pipeline Architecture:</strong>
                Create a single master Experience Builder template item in ArcGIS Online. Then, write a script that connects with a service account, reads the template JSON, updates office coordinates and product URLs, and posts new public experiences. You can hook this to a simple form or CLI tool!
              </div>
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 m-0">
                2-Year Decommissioning &amp; Migration Plan
              </h3>
              <p className="text-xs text-slate-500 m-0">
                Recommended timeline for safely retiring the old web server and transitioning to ESRI cloud infrastructure:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    Q1
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 m-0">Phase 1: Experience Builder Prototype</h4>
                    <p className="text-xs text-slate-600 m-0 mt-0.5">
                      Deploy the React code as a custom widget in ArcGIS Experience Builder Developer Edition. Verify all live feeds (`api.weather.gov`, ACIS, NOAA graphics) render correctly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    Q2
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 m-0">Phase 2: ArcGIS Online Public Hosting &amp; Python Templating</h4>
                    <p className="text-xs text-slate-600 m-0 mt-0.5">
                      Publish the Experience to ArcGIS Online as a public item. Set up the Python automation script to clone and publish customized versions for other forecast offices.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    Q3
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 m-0">Phase 3: Partner User Testing &amp; Hub Integration</h4>
                    <p className="text-xs text-slate-600 m-0 mt-0.5">
                      Distribute the public ArcGIS Experience URL to Alabama emergency managers. Optionally embed the experience inside your agency's ArcGIS Hub open data site.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    Q4
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 m-0">Phase 4: DNS Redirection &amp; Legacy Server Sunset</h4>
                    <p className="text-xs text-slate-600 m-0 mt-0.5">
                      Set up 301 redirects on the legacy server pointing users to the new ESRI cloud domain. Decommission the physical web server well before the 2-year expiration deadline.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Full compliance with ArcGIS Online Public Security &amp; Cross-Origin Standards
          </div>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

const opentelemetry = require('@opentelemetry/api');
const { SimpleSpanProcessor } = require('@opentelemetry/tracing');
const { ConsoleSpanExporter } = require('@opentelemetry/tracing');
const { NodeTracerProvider } = require('@opentelemetry/node');
const { CollectorTraceExporter } =  require('@opentelemetry/exporter-collector-grpc');
const ExpressLayerType = require('@opentelemetry/plugin-express')




const { Context } = require('@opentelemetry/api');
const { ReadableSpan } = require( '@opentelemetry/tracing');
const { Span } = require( '@opentelemetry/tracing');
// const { SpanProcessor } = require( '@opentelemetry/tracing');

var os = require("os");
var hostname = os.hostname();

class AttributeSpanProcessor {
  onStart(span, _context) {
    span.setAttribute("host.name", hostname);
  }
  onEnd(_span) {}
  shutdown() {
    return Promise.resolve();
  }
  forceFlush() {
    return Promise.resolve();
  }
}

module.exports = (serviceName, url) => {
  var logStdout = false
  if (url == "stdout") {
    logStdout = true
  }
  const collectorOptions = {
    serviceName: serviceName,
    url: url // url is optional and can be omitted - default is localhost:4317
  };
  
  console.log("serviceName : " + serviceName + ", url : " + url)

  

  const exporter = new CollectorTraceExporter(collectorOptions);
  const provider = new NodeTracerProvider({
    plugins: {

      http: {
        enabled: true,
        path: '@opentelemetry/plugin-http',
        ignoreIncomingPaths: [new RegExp('.*(png|html)')],
      },
      express: {
        enabled: true,
        // You may use a package name or absolute path to the file.
        path: '@opentelemetry/plugin-express',
        ignoreLayers: [new RegExp('middleware.*')],
        ignoreLayersType: [ExpressLayerType.MIDDLEWARE],
      },
    }
  });

  if (!logStdout) {
    provider.addSpanProcessor(new AttributeSpanProcessor())
    provider.addSpanProcessor(SimpleSpanProcessor(exporter));
  } else {
    provider.addSpanProcessor(new AttributeSpanProcessor())
    var stdexporter = new ConsoleSpanExporter();
    provider.addSpanProcessor(new SimpleSpanProcessor(stdexporter));
  }
  provider.register();
  return opentelemetry.trace.getTracer("front-end");
};
Hashgraph-Web Tier Communication
================================

This project contains a demonstration of a web application communicating with a Swirld via a TLS-secured, authenticated socket.  The application tracks lions, tigers, and bears in a zoo.  Users can add animals to the zoo and see the updated state.  The zoo state is tracked in a Swirld, and adding an animal executes a transaction on the Swirld.

To run the demo, install Docker, change into the root directory of the project (where the docker-compose.yml file lives) and run 

`docker-compose up`

Once each Docker container is up and running, you can point your browser at "localhost" and load up the zoo application.

How It Works
------------

Walking through the Swirld itself is outside the scope of what I'm trying to ddemonstrate, so if you're not familiar with how a Swirld works, please head over to swirlds.com and download the SDK and read the docs.

In either Java project, the communications code is centralized in the com.txmq.swirldsframework.messaging package.   This code should be reusable between applications.  Right now, the hostname of the Swirld is hard-coded to the name of the Docker container it runs in.  A better approach would be to pull this from a configuration file, parameter, JNDI, etc. but be aware if you reuse this code or try to run outside of Docker, you'll need to update the hostname in SwirldsAdaptor in your client (web API) project.

We'll walk through the code in the order in which it's invoked.  First, the Swirld is started.  During initialization, it creates an instance of TransactionServer.  TransactionServer is responsible for configuring the security setup we're going to use, and opening a server socket to listen for client connections.  In the constructor, we instantiate the key management objects we need to secure the connection.  For the purposes of the demo, we are using a single public/private key pair for a single client.  All of the servers use the same server key pair.  When the client (web API tier) attempts to connect, it will authenticate using it's private key, which is validated on the Swirld using the client's public key, which is known to the Swirld (loaded on line 36).  Only clients that the Swirld already knows can be authenticated.

Next, a request will come through the REST API.  When you load the web app in the browser, it will issue a call to the REST API to retrieve the current state of the zoo.  In the API code, the request is ultimately handled by the getZoo method of ZooApiServiceImpl, in the io.swagger.api.impl package.  The method creates an instance of SwirldsAdaptor, which is the clientside communication management class for connecting to the Swirld.

SwirldsAdaptor works a lot like TransactionServer, but for the client side of the socket connection.  The server's hostname is hard-coded (see above) in this class, so if you're going to reuse the code or run outside of Docker, you'll need to change the host name on line 29 of SwirldsAdaptor.java.  Like TransactionServer, its constructor sets up key management and TLS on the socket, and public/private key pairs are used to authenticate client to server and server to client.  Once the service has created an adaptor, it invokes the sendTransaction method on the adaptor to send a transaction to the Swirld over the socket.  

Each transaction is encapsulated in a SwirldsMessage instance.  A SwirldsMessage consists of a transactiont type and a payload.  Transaction types are defined as an enum called SwirldsTransactionType.  A copy of this file exists on both the client and server, and it defines the types of transactions supported by the Swirld.  In our case, we have two "requests" - GET_ZOO (for retrieving the state of the zoo) and ADD_ANIMAL (for requesting that new animals are added to the zoo).  We also have a single response type, ACKNOWLEDGE.  SwirldsMessage payloads can be any Java type that implements Serializable.  Using the payload and transaction type, you can support passing Java objects of just about any type between the Swirld and your REST implementation.  The model objects for our application are in the io.swagger.model package, Animal.java and Zoo.java.  The model objects must exist on both the client and server, and in the case of the server you'll need to strip the annotations used by JAX-RS (or Spring or whatever).  When the add animal method is invoked, an instance of Animal is passed to the Swirld in the pyaload field.  When the get zoo method is invoked, the Hashgraph returns an instance of Zoo in the payload of the acknowledge message it returns to the API.  SwirldsMessage includes the code necessary to serialize and deserialize SwirldsMessages to and from byte arrays, which are transmitted over the socket.

TL;DR:  Define your transaction types in SwirldsTransactionType, create your model objects in both the client and server projects, and pass an instance of SwirldsMessage to SwirldsAdaptor.sendTransaction().

Reuse
-----

You are welcome to reuse/modify this code pursuant to the terms of the license file.  You'll want to copy the com.txmq.swirldsframework.messaging package into your application.  Next, define your transaction types and model objects.  On the server side, create an instance of TransactionServer to listen for client connections.  Finally, build out your REST API in the technology of your choosing and use SwirldsAdaptor to handle messaging between the Swirld and your REST API code.

Here's the catch:  I don't know what's coming in the near term from Swirlds.  The public SDK only runs through the Swirlds browser, which I imagine will be changed at some point.  I don't know whether or not Swirlds has a connectivity paradigm in the works, or when it would arrive.  This demonstration could certainly be developed into a framework for enabling communication between Swirlds and other Java applications, and it could be adapted to allow web clients to directly message a Swirld via web socket.  It is probably also possible to expose actions on the Swirld directly via REST, though I haven't experimented with any of that yet.  The point is, I don't know how much development this is going to see, because it could all be obsolete tomorrow.  Having said that, I'm willing to look at suggestions and pull requests if someone wants to contribute to this code.

Shameless Plug
--------------
TxMQ's Disruptive Technology Group consults and develops distributed ledger-based solutions on a number of platforms, including Swirlds.  If you have projects you're looking to build or need consulting services on Swirlds, Hyperledger, Ethereum, or blockchain/distributed ledger in general please reach out.

craig.drabik@txmq.com